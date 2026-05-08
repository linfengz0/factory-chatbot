import { useEffect, useRef } from 'react';
import { ChatProvider, useChatState } from './context/ChatContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/ChatArea/ChatArea';
import { DetailPanel } from './components/DetailPanel/DetailPanel';
import { Login } from './components/Login';
import { useSession, updateSessionLabel, getSessionList } from './hooks/useSession';
import { useWebSocketPool } from './hooks/useWebSocketPool';
import './App.css';

function AppShell() {
  const { sessionId } = useSession();
  const { messages } = useChatState();
  const labelUpdated = useRef(false);

  // Always call the hook — it no-ops when sessionId is null
  const { sendMessage } = useWebSocketPool();

  // Update session label on first user message
  useEffect(() => {
    if (!sessionId || labelUpdated.current) return;
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (firstUserMsg) {
      const list = getSessionList();
      const session = list.find((s) => s.id === sessionId);
      if (session && session.label === 'New Chat') {
        const label = firstUserMsg.content.slice(0, 30);
        updateSessionLabel(sessionId, label);
      }
      labelUpdated.current = true;
    }
  }, [messages, sessionId]);

  return (
    <div className="app">
      <Sidebar />
      {!sessionId ? (
        <main className="chat-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--ls-muted)' }}>Connecting to server...</p>
        </main>
      ) : (
        <ChatArea sendMessage={sendMessage} />
      )}
      <DetailPanel />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ChatProvider>
      <AppShell />
    </ChatProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
