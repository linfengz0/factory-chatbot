import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { ChatState, ChatAction, HistoryMessage, Message } from '../types';
import { generateId } from '../utils/helpers';

const STORAGE_KEY = 'factory_chat_messages';

function saveMessages(messages: Message[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* storage full or unavailable */ }
}

function loadMessages(): Message[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSavedMessages() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

const initialState: ChatState = {
  sessionId: null,
  messages: loadMessages() || [],
  streamingMsgId: null,
  pendingQueryResult: null,
  connectionStatus: 'disconnected',
  subGraphLabel: null,
  selectedFactory: null,
  pendingInput: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.sessionId };

    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.status };

    case 'SET_HISTORY': {
      // Use saved messages if they exist and server history is non-empty (resumed session)
      const saved = loadMessages();
      if (saved && saved.length > 0 && action.messages.length > 0) {
        return { ...state, messages: saved };
      }
      if (action.messages.length === 0) {
        clearSavedMessages();
        return { ...state, messages: [] };
      }
      const msgs: Message[] = action.messages.map((m: HistoryMessage) => ({
        id: generateId(),
        role: m.role,
        content: m.content,
        agentName: m.agent_name,
        timestamp: m.timestamp,
      }));
      return { ...state, messages: msgs };
    }

    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'user',
            content: action.content,
            timestamp: action.timestamp,
          },
        ],
      };

    case 'START_STREAM':
      return {
        ...state,
        streamingMsgId: action.msgId,
        messages: [
          ...state.messages,
          {
            id: action.msgId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isStreaming: true,
          },
        ],
      };

    case 'APPEND_STREAM': {
      const activeStreamId = state.streamingMsgId || generateId();

      let msgs = state.messages;
      if (!state.streamingMsgId) {
        msgs = [
          ...msgs,
          {
            id: activeStreamId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isStreaming: true,
          },
        ];
      }

      msgs = msgs.map((m) =>
        m.id === activeStreamId
          ? {
              ...m,
              content: m.content + action.content,
              isStreaming: !action.isFinal,
            }
          : m
      );

      let pending = state.pendingQueryResult;
      console.log('[REDUCER] APPEND_STREAM isFinal=', action.isFinal, 'pendingQueryResult=', !!pending, 'streamingMsgId=', state.streamingMsgId, 'activeStreamId=', activeStreamId);
      if (action.isFinal && pending && (pending.isError || pending.rows.length > 0)) {
        const idx = msgs.findIndex((m) => m.id === activeStreamId);
        const insertAt = idx >= 0 ? idx + 1 : msgs.length;
        console.log('[REDUCER] Inserting query_result at index', insertAt, 'after assistant idx', idx, 'rows=', pending.rows.length);
        msgs = [
          ...msgs.slice(0, insertAt),
          {
            id: generateId(),
            role: 'query_result',
            content: '',
            timestamp: new Date().toISOString(),
            queryResult: {
              isError: pending.isError,
              errorMessage: pending.errorMessage,
              rows: pending.rows,
              extraColumns: pending.extraColumns,
              externalError: pending.externalError,
            },
          },
          ...msgs.slice(insertAt),
        ];
        pending = null;
      }

      return {
        ...state,
        messages: msgs,
        streamingMsgId: action.isFinal ? null : activeStreamId,
        pendingQueryResult: pending,
      };
    }

    case 'ADD_SYSTEM_MSG':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'system',
            content: action.content,
            timestamp: action.timestamp,
          },
        ],
      };

    case 'SET_STATUS':
      return { ...state, subGraphLabel: action.label };

    case 'CLEAR_STATUS':
      return { ...state, subGraphLabel: null };

    case 'OPEN_FACTORY':
      return { ...state, selectedFactory: action.factory };

    case 'CLOSE_FACTORY':
      return { ...state, selectedFactory: null };

    case 'SET_QUERY_RESULT':
      console.log('[REDUCER] SET_QUERY_RESULT rows=', action.rows.length, 'isError=', action.isError, 'extraColumns=', action.extraColumns, 'streamingMsgId=', state.streamingMsgId);
      // If no active stream, insert the query_result message directly (skip empty non-error results)
      if (!state.streamingMsgId && (action.isError || action.rows.length > 0)) {
        const msg: Message = {
          id: generateId(),
          role: 'query_result',
          content: '',
          timestamp: new Date().toISOString(),
          queryResult: {
            isError: action.isError,
            errorMessage: action.errorMessage,
            rows: action.rows,
            extraColumns: action.extraColumns,
            externalError: action.externalError,
          },
        };
        return {
          ...state,
          messages: [...state.messages, msg],
          pendingQueryResult: null,
        };
      }
      // No-op for empty non-error results when no stream
      if (!state.streamingMsgId) {
        return state;
      }
      // Otherwise hold in pending until stream completes
      return {
        ...state,
        pendingQueryResult: {
          rows: action.rows,
          extraColumns: action.extraColumns,
          isError: action.isError,
          errorMessage: action.errorMessage,
          externalError: action.externalError,
        },
      };

    case 'SET_PENDING_INPUT':
      return { ...state, pendingInput: action.value };

    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Persist messages so query_result tables survive page refresh
  useEffect(() => {
    if (state.messages.length > 0) {
      saveMessages(state.messages);
    }
  }, [state.messages]);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}

export function useChatState() {
  return useChat().state;
}

export function useChatDispatch() {
  return useChat().dispatch;
}
