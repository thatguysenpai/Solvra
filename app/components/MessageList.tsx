'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/lib/types';
import Message from './Message';

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  onRegenerate: () => void;
}

/** Scrolls to the bottom as tokens arrive, unless the reader has scrolled up. */
export default function MessageList({ messages, isStreaming, onRegenerate }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const prevLength = useRef(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (messages.length > prevLength.current) stick.current = true; // new turn → follow it
    prevLength.current = messages.length;
    if (stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const lastIndex = messages.length - 1;

  return (
    <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-8 pb-6">
        {messages.map((m, i) => (
          <Message
            key={m.id}
            message={m}
            streaming={isStreaming && i === lastIndex && m.role === 'assistant'}
            canRegenerate={!isStreaming && i === lastIndex && m.role === 'assistant'}
            onRegenerate={onRegenerate}
          />
        ))}
      </div>
    </div>
  );
}
