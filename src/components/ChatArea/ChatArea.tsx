import { useEffect, useRef } from 'react';
import { useChatState } from '../../context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { QueryResultCard } from './QueryResultCard';
import { InputBar } from './InputBar';

interface ChatAreaProps {
  sendMessage: (content: string) => void;
}

export function ChatArea({ sendMessage }: ChatAreaProps) {
  const { messages, subGraphLabel, pendingQueryResult } = useChatState();
  const bottomRef = useRef<HTMLDivElement>(null);

  console.log('[ChatArea] render messages count=', messages.length, 'pendingQueryResult=', !!pendingQueryResult,
    messages.map(m => `${m.role}${m.role === 'query_result' ? '(rows:' + (m.queryResult?.rows?.length ?? 0) + ')' : ''}`));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main className="chat-area">
      <div className="messages">
        {messages.length === 0 && (
          <div className="msg msg-ai">
            <div className="msg-avatar">AI</div>
            <div className="msg-body">
            Hello! I'm your factory intelligent matching assistant. You can ask me about factory capacity, certifications, clients, and more. For example:  <br />
"Which factories in Vietnam produce jeans, and what is their available capacity for next month?"
            </div>
          </div>
        )}
        {messages.map((msg) =>
          msg.role === 'query_result' && msg.queryResult ? (
            <QueryResultCard key={msg.id} data={msg.queryResult} />
          ) : msg.role === 'query_result' ? null : (
            <MessageBubble key={msg.id} message={msg} />
          )
        )}
        {subGraphLabel && (
          <div className="msg msg-system">
            <div className="msg-body">{subGraphLabel}</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <InputBar sendMessage={sendMessage} />
    </main>
  );
}
