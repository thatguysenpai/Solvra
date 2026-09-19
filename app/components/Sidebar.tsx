'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { Check, PanelLeftClose, Plus, Trash2, X } from 'lucide-react';
import type { Conversation } from '@/lib/types';
import { APP_NAME } from '@/lib/brand';
import { groupConversations } from '@/lib/groupConversations';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const noopSubscribe = () => () => {};
const modifierKey = () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl ');

export default function Sidebar({ conversations, activeId, open, onClose, onNew, onSelect, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const mod = useSyncExternalStore(noopSubscribe, modifierKey, () => 'Ctrl ');
  const groups = useMemo(() => groupConversations(conversations), [conversations]);

  return (
    <>
      {/* Backdrop — mobile only */}
      {open && <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={onClose} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 select-none flex-col border-r border-line bg-sidebar transition-[transform,margin] duration-200 md:static md:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:-ml-64'
        }`}
        aria-label="Conversations"
      >
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-2.5 px-1.5 py-1">
            <Image
              src="/solvra-logo.png"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-md border border-line-strong object-cover"
            />
            <span className="text-[15px] font-medium tracking-tight">{APP_NAME}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="rounded-lg p-1.5 text-[#88837a] transition-colors hover:bg-line hover:text-ink"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onNew}
            className="group flex w-full items-center justify-between rounded-xl border border-line-strong bg-white px-3 py-2 text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:bg-paper"
          >
            <span className="flex items-center gap-2">
              <Plus size={17} className="text-accent" />
              Start new chat
            </span>
            <span className="font-mono text-[11px] text-ink-muted group-hover:text-ink-soft">{mod}K</span>
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-2 text-xs">
          {groups.length === 0 && <p className="px-2.5 py-2 text-ink-muted">No conversations yet.</p>}
          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((c) => {
                  const active = c.id === activeId;
                  const confirming = confirmId === c.id;
                  return (
                    <li key={c.id} className="group/item relative">
                      <button
                        type="button"
                        onClick={() => onSelect(c.id)}
                        className={`block w-full truncate rounded-lg px-2.5 py-1.5 pr-14 text-left transition-colors ${
                          active
                            ? 'bg-[#efece5] font-medium text-ink'
                            : 'text-ink-soft hover:bg-hover-strong hover:text-ink'
                        }`}
                      >
                        {c.title || 'Untitled'}
                      </button>
                      <div
                        className={`absolute right-1 top-1/2 flex -translate-y-1/2 items-center ${
                          confirming ? '' : 'opacity-0 group-hover/item:opacity-100 focus-within:opacity-100'
                        }`}
                      >
                        {confirming ? (
                          <>
                            <button
                              type="button"
                              title="Confirm delete"
                              aria-label="Confirm delete"
                              onClick={() => {
                                setConfirmId(null);
                                onDelete(c.id);
                              }}
                              className="rounded p-1 text-[#a64731] hover:bg-accent-tint"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              title="Cancel"
                              aria-label="Cancel delete"
                              onClick={() => setConfirmId(null)}
                              className="rounded p-1 text-ink-soft hover:bg-line"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            title="Delete chat"
                            aria-label={`Delete ${c.title}`}
                            onClick={() => setConfirmId(c.id)}
                            className="rounded p-1 text-ink-muted hover:bg-line hover:text-[#a64731]"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line bg-[#f3f0ea] px-4 py-3 font-mono text-[11px] text-ink-muted">
          Stored in this browser only.
        </div>
      </aside>
    </>
  );
}
