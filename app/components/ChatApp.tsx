'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, Conversation } from '@/lib/types';
import { loadConversations, saveConversations } from '@/lib/storage';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import EmptyState from './EmptyState';
import Composer from './Composer';

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Messages worth sending back to the model: skip failed turns and empty placeholders. */
const toApiMessages = (messages: ChatMessage[]) =>
  messages.filter((m) => !m.error && m.content.trim()).map(({ role, content }) => ({ role, content }));

/** Client-only: reads localStorage during initial state, so it must never be server-rendered. */
export default function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const abortRef = useRef<AbortController | null>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  // ── Persistence (debounced: streaming updates state on every chunk) ──────
  useEffect(() => {
    const t = setTimeout(() => saveConversations(conversations), 300);
    return () => clearTimeout(t);
  }, [conversations]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const patchConversation = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const closeSidebarOnMobile = () => {
    if (!window.matchMedia('(min-width: 768px)').matches) setSidebarOpen(false);
  };

  // ── Streaming ────────────────────────────────────────────────────────────
  /** Appends an empty assistant message to `convId` and streams the reply into it. */
  const streamReply = useCallback(
    async (convId: string, history: ChatMessage[]) => {
      const assistantId = uid();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      const setAssistant = (fn: (m: ChatMessage) => ChatMessage) =>
        patchConversation(convId, (c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === assistantId ? fn(m) : m)),
        }));

      patchConversation(convId, (c) => ({
        ...c,
        messages: [...history, { id: assistantId, role: 'assistant', content: '' }],
      }));

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: toApiMessages(history) }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let message = `Request failed (${res.status}).`;
          try {
            const data = await res.json();
            if (data?.error) message = data.details ? `${data.error} — ${data.details}` : data.error;
          } catch {
            /* non-JSON error body */
          }
          throw new Error(message);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) setAssistant((m) => ({ ...m, content: m.content + chunk }));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // User pressed Stop: keep whatever streamed so far.
        } else {
          const message = err instanceof Error ? err.message : 'Something went wrong.';
          setAssistant((m) => ({ ...m, content: message, error: true }));
        }
      } finally {
        // Drop the placeholder if nothing ever arrived (e.g. stopped immediately).
        patchConversation(convId, (c) => ({
          ...c,
          messages: c.messages.filter((m) => !(m.id === assistantId && m.content === '')),
        }));
        if (abortRef.current === controller) abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [patchConversation],
  );

  const handleSend = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      const userMsg: ChatMessage = { id: uid(), role: 'user', content };
      let convId = activeId;
      let history: ChatMessage[];

      if (active) {
        history = [...active.messages, userMsg];
        patchConversation(active.id, (c) => ({ ...c, messages: history }));
      } else {
        convId = uid();
        history = [userMsg];
        const created: Conversation = {
          id: convId,
          title: content.slice(0, 40),
          messages: history,
          createdAt: Date.now(),
        };
        setConversations((prev) => [created, ...prev]);
        setActiveId(convId);
      }

      void streamReply(convId!, history);
    },
    [active, activeId, isStreaming, patchConversation, streamReply],
  );

  const handleRegenerate = useCallback(() => {
    if (!active || isStreaming) return;
    const last = active.messages[active.messages.length - 1];
    if (last?.role !== 'assistant') return;
    void streamReply(active.id, active.messages.slice(0, -1));
  }, [active, isStreaming, streamReply]);

  const handleStop = () => abortRef.current?.abort();

  // ── Conversation management ──────────────────────────────────────────────
  const handleNew = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    closeSidebarOnMobile();
  }, []);

  const handleSelect = (id: string) => {
    if (id === activeId) return closeSidebarOnMobile();
    abortRef.current?.abort();
    setActiveId(id);
    closeSidebarOnMobile();
  };

  const handleDelete = (id: string) => {
    if (id === activeId) {
      abortRef.current?.abort();
      setActiveId(null);
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  // ⌘K / Ctrl+K → new chat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNew();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNew]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden bg-paper">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNew={handleNew}
        onSelect={handleSelect}
        onDelete={handleDelete}
      />

      <main className="flex h-full min-w-0 flex-1 flex-col">
        <ChatHeader title={active?.title} sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} />

        {active && active.messages.length > 0 ? (
          <MessageList
            key={active.id}
            messages={active.messages}
            isStreaming={isStreaming}
            onRegenerate={handleRegenerate}
          />
        ) : (
          <EmptyState onPick={handleSend} />
        )}

        <Composer isStreaming={isStreaming} onSend={handleSend} onStop={handleStop} focusKey={activeId} />
      </main>
    </div>
  );
}
