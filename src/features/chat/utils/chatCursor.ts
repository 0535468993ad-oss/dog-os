import type { ChatHistoryRow } from '@/lib/database.types';

// Keyset paging for chat history in the total order (created_at, id). Timestamps can tie across devices, so the
// id breaks ties; the cursor goes into a PostgREST or() filter, so both parts are validated before interpolation.

/** The position of a stored message in the conversation's total order. */
export interface ChatCursor {
  createdAt: string;
  id: string;
}

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The cursor for a message, or null for one the server has not stored yet (an optimistic placeholder). */
export function cursorFor(message: Pick<ChatHistoryRow, 'id' | 'created_at'>): ChatCursor | null {
  return ISO_TIMESTAMP.test(message.created_at) && UUID.test(message.id) ? { createdAt: message.created_at, id: message.id } : null;
}

/** The PostgREST or() filter for "strictly before the cursor"; values are quoted because timestamps contain . : and +. */
export function olderThanFilter(cursor: ChatCursor): string {
  if (!ISO_TIMESTAMP.test(cursor.createdAt) || !UUID.test(cursor.id)) throw new Error('Invalid chat cursor');
  return `created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt.${cursor.id})`;
}

/** Orders messages oldest first by (created_at, id), the same order the server pages in. */
export function compareChronological(a: Pick<ChatHistoryRow, 'id' | 'created_at'>, b: Pick<ChatHistoryRow, 'id' | 'created_at'>): number {
  const byTime = Date.parse(a.created_at) - Date.parse(b.created_at);
  if (byTime !== 0) return byTime;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Adds an older page to the cached conversation: one copy per id, oldest first. */
export function mergeOlderMessages(current: readonly ChatHistoryRow[], older: readonly ChatHistoryRow[]): ChatHistoryRow[] {
  const known = new Set(current.map((message) => message.id));
  return [...older.filter((message) => !known.has(message.id)), ...current].sort(compareChronological);
}
