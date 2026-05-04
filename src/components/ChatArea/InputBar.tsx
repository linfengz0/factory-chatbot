import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { useChatDispatch, useChatState } from '../../context/ChatContext';

interface InputBarProps {
  sendMessage: (content: string) => void;
}

export function InputBar({ sendMessage }: InputBarProps) {
  const [input, setInput] = useState('');
  const dispatch = useChatDispatch();
  const { connectionStatus, streamingMsgId, pendingInput } = useChatState();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingInput !== null) {
      setInput(pendingInput);
      dispatch({ type: 'SET_PENDING_INPUT', value: null });
      inputRef.current?.focus();
    }
  }, [pendingInput, dispatch]);

  const isStreaming = streamingMsgId !== null;
  const isConnected = connectionStatus === 'connected';

  const submit = () => {
    const content = input.trim();
    if (!content || !isConnected || isStreaming) return;

    dispatch({
      type: 'ADD_USER_MESSAGE',
      content,
      timestamp: new Date().toISOString(),
    });
    sendMessage(content);
    setInput('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form className="input-bar" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Ask me about factory capacity, certifications, clients, and more..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!isConnected || isStreaming}
      />
      <button className="btn" type="submit" disabled={!isConnected || isStreaming || !input.trim()}>
        Send
      </button>
    </form>
  );
}
