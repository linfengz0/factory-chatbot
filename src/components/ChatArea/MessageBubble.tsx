import { useCallback } from 'react';
import { useChatDispatch } from '../../context/ChatContext';
import { renderMarkdown } from '../../utils/markdown';
import type { Message } from '../../types';
import { factories } from '../../data/factories';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const dispatch = useChatDispatch();

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isStreaming = message.isStreaming;

  const avatarContent = isUser ? 'U' : isSystem ? '!' : 'AI';
  const roleClass = isUser ? 'msg-user' : isSystem ? 'msg-system' : 'msg-ai';

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const factoryEl = target.closest('.factory-name');
      if (factoryEl) {
        const factoryId = factoryEl.getAttribute('data-factory');
        if (factoryId && factories[factoryId]) {
          dispatch({ type: 'OPEN_FACTORY', factory: factories[factoryId] });
        }
      }
    },
    [dispatch]
  );

  const renderContent = () => {
    if (isSystem) {
      return <span>{message.content}</span>;
    }
    const html = renderMarkdown(message.content);
    return (
      <span
        className={isStreaming ? 'stream-cursor' : ''}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <div className={`msg ${roleClass}`}>
      <div className="msg-avatar">{avatarContent}</div>
      <div className="msg-body" onClick={handleClick}>
        {renderContent()}
      </div>
    </div>
  );
}
