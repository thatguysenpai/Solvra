'use client';

import { Menu } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';

interface Props {
  title?: string;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
}

export default function ChatHeader({ title, sidebarOpen, onOpenSidebar }: Props) {
  return (
    <header className="z-20 flex h-13 shrink-0 items-center gap-3 border-b border-line bg-paper/90 px-5 backdrop-blur-xs">
      {!sidebarOpen && (
        <button
          type="button"
          onClick={onOpenSidebar}
          title="Open sidebar"
          aria-label="Open sidebar"
          className="-ml-1 rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-hover hover:text-ink"
        >
          <Menu size={19} />
        </button>
      )}
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <span className="h-2 w-2 rounded-full bg-brand" />
        {APP_NAME}
      </div>
      {title && (
        <>
          <div className="hidden h-4 w-px bg-[#e2ded6] sm:block" />
          <span className="hidden max-w-md truncate text-xs text-[#8c867b] sm:inline">{title}</span>
        </>
      )}
    </header>
  );
}
