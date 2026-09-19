'use client';

import { memo } from 'react';
import Image from 'next/image';
import { RefreshCw, User } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { APP_NAME } from '@/lib/brand';
import CopyButton from './CopyButton';
import Markdown from './Markdown';

interface Props {
  message: ChatMessage;
  /** This assistant message is the one currently being streamed. */
  streaming?: boolean;
  /** Show the regenerate action (last assistant message, nothing streaming). */
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}

function Thinking() {
  return (
    <div className="flex items-center gap-1.5 py-2" role="status" aria-label={`${APP_NAME} is thinking`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-dot rounded-full bg-accent"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </div>
  );
}

function MessageView({ message, streaming, canRegenerate, onRegenerate }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong bg-[#e4dfd5] text-[#524e47]">
          <User size={16} />
        </div>
        <div className="min-w-0 flex-1 space-y-1 pt-1">
          <div className="text-xs font-medium text-[#8c867b]">You</div>
          <div className="whitespace-pre-wrap rounded-2xl border border-line bg-white/70 p-4 text-[15px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.03)] [overflow-wrap:anywhere]">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const showThinking = streaming && message.content === '';

  return (
    <div className="flex items-start gap-4">
      <Image
        src="/solvra-logo.png"
        alt={APP_NAME}
        width={32}
        height={32}
        className="mt-0.5 h-8 w-8 shrink-0 rounded-md border border-line-strong object-cover"
      />
      <div className="min-w-0 flex-1 pt-1">
        <div className="mb-1 flex h-6 items-center justify-between">
          <div className="text-xs font-semibold">{APP_NAME}</div>
          {!streaming && message.content && (
            <div className="flex items-center gap-0.5 text-[#8c867b]">
              {!message.error && (
                <CopyButton
                  text={message.content}
                  title="Copy response"
                  className="rounded p-1 transition-colors hover:bg-hover hover:text-ink"
                />
              )}
              {canRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  title="Regenerate"
                  aria-label="Regenerate response"
                  className="rounded p-1 transition-colors hover:bg-hover hover:text-ink"
                >
                  <RefreshCw size={15} />
                </button>
              )}
            </div>
          )}
        </div>
        {showThinking ? (
          <Thinking />
        ) : message.error ? (
          <p className="rounded-xl border border-[#f3d7cc] bg-accent-tint px-4 py-3 text-sm text-[#883624]">
            {message.content}
          </p>
        ) : (
          <Markdown content={message.content} />
        )}
      </div>
    </div>
  );
}

export default memo(MessageView);
