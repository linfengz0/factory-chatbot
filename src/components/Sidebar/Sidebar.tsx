import { useState, useCallback } from 'react';
import { useChatState, useChatDispatch } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { newSession, getSessionList, removeSession } from '../../hooks/useSession';
import './Sidebar.css';

export function Sidebar() {
  const { connectionStatus, sessionId, wsSessions } = useChatState();
  const dispatch = useChatDispatch();
  const { logout } = useAuth();
  const [, setTick] = useState(0);
  const sessions = getSessionList();

  const handleSwitch = useCallback((id: string) => {
    if (id !== sessionId) {
      dispatch({ type: 'SET_SESSION_ID', sessionId: id });
    }
  }, [sessionId, dispatch]);

  const handleNewChat = useCallback(() => {
    newSession().then((id) => {
      dispatch({ type: 'SET_SESSION_ID', sessionId: id });
      setTick((t) => t + 1);
    });
  }, [dispatch]);

  const handleRemove = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const switchTo = removeSession(id);
    if (switchTo) {
      dispatch({ type: 'SET_SESSION_ID', sessionId: switchTo });
    }
    setTick((t) => t + 1);
  }, [dispatch]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/logo_Black.png" alt="Leverstyle" />
        </div>
        <button className="sidebar-new-chat" onClick={handleNewChat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
      </div>

      <nav className="sidebar-history">
        <div className="sidebar-section-title">History</div>
        {sessions.map((s) => {
          const wsStatus = wsSessions[s.id] || 'disconnected';
          return (
            <div
              key={s.id}
              className={`history-item${s.id === sessionId ? ' active' : ''}`}
            >
              <button
                className="history-item-main"
                onClick={() => handleSwitch(s.id)}
              >
                <span
                  className={`history-dot${wsStatus === 'connected' ? ' live' : ''}`}
                  title={wsStatus === 'connected' ? 'Connected' : 'Disconnected'}
                />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>{s.label}</span>
              </button>
              <button
                className="history-item-close"
                onClick={(e) => handleRemove(s.id, e)}
                title="Delete chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">B</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">Bob</div>
            <div className="user-role">Sourcing Manager</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
        <div className="sidebar-conn-status">
          {connectionStatus === 'connected' && (
            <span style={{ fontSize: 11, color: 'var(--ls-success)' }}>Connected</span>
          )}
          {connectionStatus === 'connecting' && (
            <span style={{ fontSize: 11, color: 'var(--ls-warn)' }}>Connecting...</span>
          )}
          {connectionStatus === 'disconnected' && (
            <span style={{ fontSize: 11, color: 'var(--ls-muted)' }}>Disconnected</span>
          )}
        </div>
      </div>
    </aside>
  );
}
