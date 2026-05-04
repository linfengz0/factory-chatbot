import { useEffect, useRef, useCallback } from 'react';
import { useChatDispatch, useChatState } from '../context/ChatContext';
import { createWebSocket } from '../services/api';
import type { QueryResultEvent, QueryResultRow, StreamEvent, WsServerEvent } from '../types';

function streamIsFinal(e: StreamEvent): boolean {
  return e.is_final === true || e.isFinal === true;
}

/** Raw payload from `query_result` or `queryResult` field. */
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

export function useWebSocket() {
  const dispatch = useChatDispatch();
  const { sessionId } = useChatState();
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!sessionId) return;

    dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connecting' });

    const ws = createWebSocket(sessionId);
    wsRef.current = ws;

    ws.onopen = () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connected' });
      retryCountRef.current = 0;
    };

    ws.onmessage = (e) => {
      try {
        const event: WsServerEvent = JSON.parse(e.data);
        try {
          handleEvent(event);
        } catch (err) {
          console.error('Error handling WS event:', event.type, err);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'disconnected' });
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, dispatch]);

  const handleEvent = useCallback(
    (event: WsServerEvent) => {
      switch (event.type) {
        case 'history':
          dispatch({ type: 'SET_HISTORY', messages: event.messages });
          break;

        case 'system':
          dispatch({
            type: 'ADD_SYSTEM_MSG',
            content: event.content,
            timestamp: new Date().toISOString(),
          });
          break;

        case 'sub_graph_status':
          dispatch({ type: 'SET_STATUS', label: event.label });
          break;

        case 'query_result': {
          const qe = event as QueryResultEvent;
          const displayMode = qe.display_mode ?? qe.displayMode ?? 'table';
          const raw = qe.query_result ?? qe.queryResult ?? null;
          const extraColumns = extraColumnsFromPayload(raw, qe.extra_columns ?? qe.extraColumns ?? []);
          const errMsg = errorFromQueryPayload(raw);
          const rows = rowsFromQueryPayload(raw);
          console.log(
            '[WS] query_result event:',
            JSON.stringify({
              display_mode: displayMode,
              hasRows: rows != null,
              rowCount: rows?.length ?? 0,
              hasError: errMsg != null,
              extraColumns,
            })
          );
          if (displayMode !== 'table') break;

          if (errMsg) {
            dispatch({
              type: 'SET_QUERY_RESULT',
              rows: [],
              extraColumns: [],
              isError: true,
              errorMessage: errMsg,
            });
          } else if (rows) {
            dispatch({
              type: 'SET_QUERY_RESULT',
              rows,
              extraColumns,
              isError: false,
            });
          } else {
            console.warn('[WS] query_result ignored: expected array rows or { rows|data|items: [] }, got', raw);
          }
          break;
        }

        case 'stream': {
          const se = event as StreamEvent;
          const isFinal = streamIsFinal(se);
          const chunk = se.content ?? '';
          console.log(
            '[WS] stream event:',
            JSON.stringify({
              is_final: se.is_final,
              isFinal: se.isFinal,
              resolvedFinal: isFinal,
              contentLen: chunk.length,
            })
          );
          if (isFinal) {
            dispatch({ type: 'APPEND_STREAM', content: '', isFinal: true });
            dispatch({ type: 'CLEAR_STATUS' });
          } else {
            dispatch({
              type: 'APPEND_STREAM',
              content: chunk,
              isFinal: false,
            });
          }
          break;
        }

        case 'tool_call':
        case 'tool_result':
          // silently ignore for now, can add UI later
          break;
      }
    },
    [dispatch]
  );

  const scheduleReconnect = useCallback(() => {
    const delay = Math.min(Math.pow(2, retryCountRef.current) * 1000, 15000);
    retryCountRef.current += 1;
    timerRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { sendMessage };
}
