import type { Conversation } from './types';

export interface ConversationGroup {
  label: string;
  items: Conversation[];
}

const DAY = 24 * 60 * 60 * 1000;

/** Buckets conversations (newest first) into Today / Yesterday / Previous 7 Days / Older. */
export function groupConversations(conversations: Conversation[], now = Date.now()): ConversationGroup[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const today = startOfToday.getTime();

  const buckets: ConversationGroup[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 Days', items: [] },
    { label: 'Older', items: [] },
  ];

  const sorted = [...conversations].sort((a, b) => b.createdAt - a.createdAt);
  for (const c of sorted) {
    if (c.createdAt >= today) buckets[0].items.push(c);
    else if (c.createdAt >= today - DAY) buckets[1].items.push(c);
    else if (c.createdAt >= today - 7 * DAY) buckets[2].items.push(c);
    else buckets[3].items.push(c);
  }
  return buckets.filter((b) => b.items.length > 0);
}
