import { useEffect, useRef, useCallback } from 'react';
import { useChatDispatch, useChatState, saveMessages } from '../context/ChatContext';
import { createWebSocket } from '../services/api';
import { generateId } from '../utils/helpers';
import type {
  HistoryMessage, Message, QueryResultEvent, QueryResultRow,
  StreamEvent, WsServerEvent,
} from '../types';

const MAX_CONNECTIONS = 5;

/* ---------- helpers (same as useWebSocket.ts) ---------- */

function streamIsFinal(e: StreamEvent): boolean {
  return e.is_final === true || e.isFinal === true;
}

function rowsFromQueryPayload(raw: unknown): QueryResultRow[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw as QueryResultRow[];
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.rows)) return o.rows as QueryResultRow[];
    if (Array.isArray(o.data)) return o.data as QueryResultRow[];
    if (Array.isArray(o.items)) return o.items as QueryResultRow[];
  }
  return null;
}

function extraColumnsFromPayload(raw: unknown, topLevel: string[]): string[] {
  if (topLevel.length > 0) return topLevel;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.extra_columns)) return o.extra_columns as string[];
    if (Array.isArray(o.extraColumns)) return o.extraColumns as string[];
  }
  return [];
}

function errorFromQueryPayload(raw: unknown): string | null {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (typeof o.error === 'string') return o.error;
    if (typeof o.message === 'string') return o.message;
  }
  return null;
}

/* ---------- pool hook ---------- */

export function useWebSocketPool() {
  const dispatch = useChatDispatch();
  const { sessionId } = useChatState();
  const wsMap = useRef<Map<string, WebSocket>>(new Map());
  const retryTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const retryCounts = useRef<Map<string, number>>(new Map());
  // LRU: most recently touched at the end
  const lru = useRef<string[]>([]);
  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;

  const touchLru = (sid: string) => {
    lru.current = lru.current.filter((s) => s !== sid);
    lru.current.push(sid);
  };

  const removeFromLru = (sid: string) => {
    lru.current = lru.current.filter((s) => s !== sid);
  };

  /* ------ accumulate background events to localStorage ------ */

  const accumulateBg = (sid: string, event: WsServerEvent) => {
    if (event.type === 'history') {
      const msgs: Message[] = event.messages.map((m: HistoryMessage) => ({
        id: generateId(),
        role: m.role,
        content: m.content,
        agentName: m.agent_name,
        timestamp: m.timestamp,
      }));
      saveMessages(sid, msgs);
    }
    // stream / query_result / system — only arrive for the session the user
    // is chatting in, so they are never "background" in practice.  Ignore.
  };

  /* ------ handle event for active session (dispatches to reducer) ------ */

  const handleActiveEvent = useCallback(
    (event: WsServerEvent) => {
      switch (event.type) {
        case 'history':
          dispatch({ type: 'SET_HISTORY', messages: event.messages });
          break;

        case 'system':
          if (!event.content.includes('Connection successful')) {
            dispatch({
              type: 'ADD_SYSTEM_MSG',
              content: event.content,
              timestamp: new Date().toISOString(),
            });
          }
          break;

        case 'sub_graph_status':
          dispatch({ type: 'SET_STATUS', label: event.label });
          break;

        case 'query_result': {
          const qe = event as QueryResultEvent;
          if ((qe.display_mode ?? qe.displayMode ?? 'table') !== 'table') break;
          const raw = qe.query_result ?? qe.queryResult ?? null;
          const extraColumns = extraColumnsFromPayload(raw, qe.extra_columns ?? qe.extraColumns ?? []);
          const errMsg = errorFromQueryPayload(raw);
          const rows = rowsFromQueryPayload(raw);
          const externalError = qe.external_error ?? qe.externalError ?? null;
          if (errMsg) {
            dispatch({ type: 'SET_QUERY_RESULT', rows: [], extraColumns: [], isError: true, errorMessage: errMsg });
          } else if (rows) {
            dispatch({ type: 'SET_QUERY_RESULT', rows, extraColumns, isError: false, externalError });
          }
          break;
        }

        case 'stream': {
          const se = event as StreamEvent;
          const isFinal = streamIsFinal(se);
          dispatch({ type: 'APPEND_STREAM', content: isFinal ? '' : (se.content ?? ''), isFinal });
          if (isFinal) dispatch({ type: 'CLEAR_STATUS' });
          break;
        }

        case 'tool_call':
        case 'tool_result':
          break;
      }
    },
    [dispatch]
  );

  /* ------ connect / disconnect ------ */

  const scheduleReconnect = useCallback(
    (sid: string) => {
      const count = retryCounts.current.get(sid) ?? 0;
      const delay = Math.min(Math.pow(2, count) * 1000, 15000);
      retryCounts.current.set(sid, count + 1);
      const timer = setTimeout(() => {
        connect(sid);
      }, delay);
      retryTimers.current.set(sid, timer);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const disconnect = useCallback(
    (sid: string) => {
      const ws = wsMap.current.get(sid);
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
        wsMap.current.delete(sid);
      }
      const timer = retryTimers.current.get(sid);
      if (timer) {
        clearTimeout(timer);
        retryTimers.current.delete(sid);
      }
      retryCounts.current.delete(sid);
      removeFromLru(sid);
      dispatch({ type: 'SET_WS_SESSION_STATUS', sessionId: sid, status: 'disconnected' });
    },
    [dispatch]
  );

  const connect = useCallback(
    (sid: string) => {
      const existing = wsMap.current.get(sid);
      if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
        touchLru(sid);
        return;
      }

      // Evict oldest if at capacity (don't evict the one we're connecting)
      while (lru.current.length >= MAX_CONNECTIONS) {
        const oldest = lru.current[0];
        if (oldest === sid) break;
        disconnect(oldest);
      }

      touchLru(sid);

      dispatch({ type: 'SET_WS_SESSION_STATUS', sessionId: sid, status: 'connecting' });

      const ws = createWebSocket(sid);
      wsMap.current.set(sid, ws);

      ws.onopen = () => {
        dispatch({ type: 'SET_WS_SESSION_STATUS', sessionId: sid, status: 'connected' });
        retryCounts.current.set(sid, 0);
      };

      ws.onmessage = (e) => {
        try {
          const event: WsServerEvent = JSON.parse(e.data);
          if (sessionRef.current === sid) {
            handleActiveEvent(event);
          } else {
            accumulateBg(sid, event);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        dispatch({ type: 'SET_WS_SESSION_STATUS', sessionId: sid, status: 'disconnected' });
        scheduleReconnect(sid);
      };

      ws.onerror = () => {
        ws.close();
      };
    },
    [dispatch, disconnect, scheduleReconnect, handleActiveEvent]
  );

  /* ------ keep active session connected ------ */

  useEffect(() => {
    if (sessionId) {
      connect(sessionId);
    }
    return () => {
      // Cleanup all WS on unmount
      wsMap.current.forEach((ws) => {
        ws.onclose = null;
        ws.close();
      });
      wsMap.current.clear();
      retryTimers.current.forEach(clearTimeout);
      retryTimers.current.clear();
    };
  }, [sessionId, connect]);

  /* ------ send message on active session ------ */

  const sendMessage = useCallback(
    (content: string) => {
      if (!sessionId) return;
      const ws = wsMap.current.get(sessionId);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'message', content }));
      }
    },
    [sessionId]
  );

  return { sendMessage };
}
