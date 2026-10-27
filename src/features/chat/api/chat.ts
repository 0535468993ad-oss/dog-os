import type { ChatHistoryRow } from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';
import { readFunctionError, reportError } from '@/utils/errors';

import { olderThanFilter, type ChatCursor } from '../utils/chatCursor';
import { ChatError } from '../utils/chatErrors';

/** Messages per page: the newest window on open, and each "load older" step. */
export const CHAT_PAGE_SIZE = 50;

/** One conversation's rows: a dog's, or the general one (dog_id null). */
function conversation(dogId: string | null) {
  const query = supabase.from('chat_history').select('*');
  return dogId ? query.eq('dog_id', dogId) : query.is('dog_id', null);
}

/** The newest page of a conversation, oldest first. */
export async function fetchChat(dogId: string | null): Promise<ChatHistoryRow[]> {
  const rows = unwrap(await conversation(dogId).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(CHAT_PAGE_SIZE));
  return rows.reverse();
}

/** The page just before a cursor (keyset on created_at, id), oldest first. */
export async function fetchChatBefore(dogId: string | null, cursor: ChatCursor): Promise<ChatHistoryRow[]> {
  const rows = unwrap(
    await conversation(dogId).or(olderThanFilter(cursor)).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(CHAT_PAGE_SIZE),
  );
  return rows.reverse();
}

function isChatRow(value: unknown): value is ChatHistoryRow {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && (v.role === 'user' || v.role === 'assistant') && typeof v.message === 'string' && typeof v.created_at === 'string';
}

/** Sends a message through the `chat` Edge Function; returns the stored user + assistant rows. */
export async function sendChatMessage(dogId: string | null, message: string): Promise<ChatHistoryRow[]> {
  const { data, error } = await supabase.functions.invoke<unknown>('chat', { body: { dogId, message } });
  if (error) {
    const { code, status } = await readFunctionError(error);
    // A server-side misconfiguration (missing function, boot failure) is an anomaly worth reporting.
    if (code === 'not_deployed' || code === 'unavailable' || code === 'internal') reportError(error, `chat:invoke:${status}`);
    throw new ChatError(code);
  }
  const rows = (data as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(rows) || !rows.every(isChatRow)) throw new ChatError('internal');
  return rows;
}

export async function clearChat(dogId: string | null): Promise<void> {
  const query = supabase.from('chat_history').delete();
  unwrap(await (dogId ? query.eq('dog_id', dogId) : query.is('dog_id', null)));
}
