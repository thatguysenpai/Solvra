'use client';

import Image from 'next/image';
import { APP_NAME } from '@/lib/brand';

const STARTERS = [
  { verb: 'Explain', prompt: 'Explain how HTTP caching works, with a concrete example.' },
  { verb: 'Draft', prompt: 'Draft a concise, friendly email asking a client for project feedback.' },
  { verb: 'Debug', prompt: 'Help me debug a React component that re-renders too often.' },
  { verb: 'Plan', prompt: 'Plan a 4-week study schedule for learning the basics of machine learning.' },
];

export default function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-10">
      <div className="m-auto flex w-full flex-col items-center">
      <Image
        src="/solvra-logo.png"
        alt=""
        width={56}
        height={56}
        priority
        className="h-14 w-14 rounded-xl border border-line-strong object-cover"
      />
      <h1 className="mt-6 text-center font-display text-4xl text-[#1a1917] sm:text-5xl">How can I help?</h1>
      <p className="mt-2 text-center text-sm text-ink-soft">Ask anything. {APP_NAME} answers in plain, dense prose.</p>

      <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s.verb}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="group rounded-xl border border-line bg-card p-3.5 text-left transition-colors hover:border-accent/50"
          >
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">{s.verb}</div>
            <div className="mt-1 text-[13px] leading-snug text-ink-soft group-hover:text-ink">{s.prompt}</div>
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
