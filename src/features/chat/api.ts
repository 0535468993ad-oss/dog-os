import type { ChatHistoryRow } from '@/lib/database.types';
import { isSchemaMissingError, supabase, unwrap } from '@/lib/supabase';
import { readFunctionError } from '@/utils/errors';

import { buildKnowledgeQuery, isKnowledgeMatchRow, toKnowledgeItem, toVectorLiteral, type KnowledgeItem } from './logic/knowledgeQuery';

export type { KnowledgeItem, KnowledgeSearchQuery } from './logic/knowledgeQuery';

export async function fetchChat(dogId: string | null): Promise<ChatHistoryRow[]> {
  const query = supabase.from('chat_history').select('*').order('created_at', { ascending: true }).limit(200);
  return unwrap(await (dogId ? query.eq('dog_id', dogId) : query.is('dog_id', null)));
}

export class ChatError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
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

export type KnowledgeBaseErrorCode = 'invalid_query' | 'schema_missing' | 'network' | 'internal';

export class KnowledgeBaseError extends Error {
  constructor(
    public readonly code: KnowledgeBaseErrorCode,
    options?: { cause?: unknown },
  ) {
    super(code, options);
    this.name = 'KnowledgeBaseError';
  }
}

/** PGRST202: RPC not in the schema cache; 42883: undefined function. Same deployment problem as a missing table. */
function isRpcMissingError(error: unknown): boolean {
  return isSchemaMissingError(error) || (!!error && typeof error === 'object' && 'code' in error && (error.code === 'PGRST202' || error.code === '42883'));
}

function knowledgeErrorCode(error: unknown): KnowledgeBaseErrorCode {
  if (isRpcMissingError(error)) return 'schema_missing';
  const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : '';
  return error instanceof TypeError || /failed to fetch|network/i.test(message) ? 'network' : 'internal';
}

/**
 * Semantic search over verified knowledge_chunks via the match_dog_knowledge RPC, closest first. An empty
 * result means nothing reached the similarity threshold (0.82 by default): the caller must then answer
 * "I don't know" rather than fall back to unsourced text.
 * Throws KnowledgeBaseError: `invalid_query` for out-of-range input (no request is sent), `schema_missing`
 * when the migration isn't applied, `network` when the server is unreachable, `internal` otherwise.
 */
export async function searchKnowledgeBase(queryVector: number[], threshold?: number, count?: number, category?: string): Promise<KnowledgeItem[]> {
  const query = buildKnowledgeQuery(queryVector, threshold, count, category);
  if (!query) throw new KnowledgeBaseError('invalid_query');
  try {
    const { data, error } = await supabase.rpc('match_dog_knowledge', {
      query_embedding: toVectorLiteral(query.queryVector),
      match_threshold: query.threshold,
      match_count: query.count,
      filter_category: query.category,
    });
    if (error) throw new KnowledgeBaseError(knowledgeErrorCode(error), { cause: error });
    const rows: unknown = data;
    if (!Array.isArray(rows) || !rows.every(isKnowledgeMatchRow)) throw new KnowledgeBaseError('internal');
    return rows.map(toKnowledgeItem);
  } catch (error) {
    if (error instanceof KnowledgeBaseError) throw error;
    throw new KnowledgeBaseError(knowledgeErrorCode(error), { cause: error });
  }
}

export const CHAT_ERROR_MESSAGES: Record<string, string> = {
  rate_limited: 'הגעתם למגבלת ההודעות לשעה. נסו שוב מאוחר יותר.',
  ai_opted_out: 'שיתוף המידע עם היועץ החכם כבוי. אפשר להפעיל אותו בניהול הסכמות.',
  ai_unavailable: 'היועץ החכם לא זמין כרגע. נסו שוב בעוד כמה דקות.',
  unauthorized: 'פג תוקף ההתחברות. התחברו מחדש.',
  network: 'אין חיבור לשרת. בדקו את החיבור לאינטרנט.',
};
