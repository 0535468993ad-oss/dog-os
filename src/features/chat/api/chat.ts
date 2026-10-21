import type { ChatHistoryRow } from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';
import { readFunctionError } from '@/utils/errors';

import { ChatError } from '../utils/chatErrors';

export async function fetchChat(dogId: string | null): Promise<ChatHistoryRow[]> {
  const query = supabase.from('chat_history').select('*').order('created_at', { ascending: true }).limit(200);
  return unwrap(await (dogId ? query.eq('dog_id', dogId) : query.is('dog_id', null)));
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
    const { code } = await readFunctionError(error);
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
