import { isSchemaMissingError, supabase } from '@/lib/supabase';

import type { KnowledgeBaseErrorCode, KnowledgeItem } from '../types';
import { KnowledgeBaseError } from '../utils/chatErrors';
import { buildKnowledgeQuery, isKnowledgeMatchRow, toKnowledgeItem, toVectorLiteral } from './knowledgeQuery';

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
