'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';

interface Props {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Change this value to pull focus back into the input (e.g. on chat switch). */
  focusKey?: string | null;
}

export default function Composer({ isStreaming, onSend, onStop, focusKey }: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Don't pop the on-screen keyboard on touch devices.
    if (window.matchMedia('(pointer: fine)').matches) ref.current?.focus();
  }, [focusKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !isStreaming;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <div className="shrink-0 bg-gradient-to-t from-paper via-paper/90 to-transparent px-4 pb-5 pt-2 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-line-strong bg-card p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-150 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30">
          <textarea
            ref={ref}
            rows={2}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={`Reply to ${APP_NAME}…`}
            aria-label="Message"
            className="block w-full resize-none border-0 bg-transparent p-1.5 text-[15px] leading-relaxed text-ink placeholder-ink-muted focus:outline-none"
          />
          <div className="mt-1 flex items-center justify-between border-t border-[#f0ece4] pt-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1 text-[11px] font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {APP_NAME}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-[11px] text-ink-muted sm:inline">
                Enter to send · Shift+Enter for newline
              </span>
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  title="Stop generating"
                  aria-label="Stop generating"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-line-strong bg-card text-ink transition-colors hover:bg-hover"
                >
                  <Square size={13} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSend}
                  title="Send"
                  aria-label="Send message"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-[#e6c9bd]"
                >
                  <ArrowUp size={17} />
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-[#a6a095]">
          {APP_NAME} can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}
