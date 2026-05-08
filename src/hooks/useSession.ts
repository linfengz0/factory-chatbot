import { useEffect } from 'react';
import { useChatDispatch, useChatState } from '../context/ChatContext';
import { createSession } from '../services/api';

const SESSION_KEY = 'factory_chat_session_id';
const SESSIONS_LIST_KEY = 'factory_chat_sessions';

export interface StoredSession {
  id: string;
  label: string;
  createdAt: string;
}

export function getSessionList(): StoredSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessionList(list: StoredSession[]) {
  localStorage.setItem(SESSIONS_LIST_KEY, JSON.stringify(list));
}

export function switchSession(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

export function updateSessionLabel(id: string, label: string) {
  const list = getSessionList();
  const idx = list.findIndex((s) => s.id === id);
  if (idx !== -1 && list[idx].label !== label) {
    list[idx].label = label;
    saveSessionList(list);
  }
}

export function newSession(): Promise<string> {
  return createSession().then((id) => {
    localStorage.setItem(SESSION_KEY, id);
    const list = getSessionList();
    const filtered = list.filter((s) => s.id !== id);
    filtered.unshift({ id, label: 'New Chat', createdAt: new Date().toISOString() });
    saveSessionList(filtered);
    return id;
  });
}

function clearMessagesForSession(sessionId: string) {
  try {
    localStorage.removeItem(`factory_chat_messages_${sessionId}`);
  } catch { /* ignore */ }
}

export function removeSession(id: string): string | null {
  const list = getSessionList();
  const updated = list.filter((s) => s.id !== id);
  saveSessionList(updated);
  clearMessagesForSession(id);

  const current = localStorage.getItem(SESSION_KEY);
  if (current === id) {
    if (updated.length > 0) {
      switchSession(updated[0].id);
      return updated[0].id;
    } else {
      localStorage.removeItem(SESSION_KEY);
      window.location.reload();
      return null;
    }
  }
  return null;
}

export function useSession() {
  const dispatch = useChatDispatch();
  const { sessionId } = useChatState();

  useEffect(() => {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      dispatch({ type: 'SET_SESSION_ID', sessionId: existing });
      return;
    }

    let cancelled = false;
    createSession()
      .then((id) => {
        if (cancelled) return;
        localStorage.setItem(SESSION_KEY, id);
        const list = getSessionList();
        const filtered = list.filter((s) => s.id !== id);
        filtered.unshift({ id, label: 'New Chat', createdAt: new Date().toISOString() });
        saveSessionList(filtered);
        dispatch({ type: 'SET_SESSION_ID', sessionId: id });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to create session:', err);
        dispatch({
          type: 'ADD_SYSTEM_MSG',
          content: '连接服务器失败，请检查网络后刷新页面。',
          timestamp: new Date().toISOString(),
        });
      });

    return () => { cancelled = true; };
  }, [dispatch]);

  return { sessionId };
}
