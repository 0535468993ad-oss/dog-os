import type { KnowledgeChunkCategory, KnowledgeMatchRow } from '@/lib/database.types';

import type { KnowledgeItem, KnowledgeSearchQuery } from '../types';

/** Must match vector(1536) in supabase/migrations/20261021120000_knowledge_chunks.sql. */
export const EMBEDDING_DIMENSIONS = 1536;
/** Same default as match_dog_knowledge: below it the advisor says it doesn't know rather than stretch a loose match. */
export const DEFAULT_MATCH_THRESHOLD = 0.82;
export const DEFAULT_MATCH_COUNT = 5;
/** The RPC clamps to this too (HNSW ef_search limit); validating here surfaces the mistake instead. */
export const MAX_MATCH_COUNT = 40;

export const KNOWLEDGE_BASE_CATEGORIES: readonly KnowledgeChunkCategory[] = [
  'EMERGENCY_TOXICOLOGY',
  'CLINICAL_NUTRITION',
  'ETHOLOGY_BEHAVIOR',
  'TRAINING_DRIVE',
  'ISRAEL_REGULATION_BREEDS',
];

export function isKnowledgeBaseCategory(value: unknown): value is KnowledgeChunkCategory {
  return typeof value === 'string' && (KNOWLEDGE_BASE_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Applies defaults and validates a search request before it reaches the network.
 * Returns null when any input is out of range, so the caller can fail fast with a typed error.
 */
export function buildKnowledgeQuery(queryVector: number[], threshold?: number, count?: number, category?: string): KnowledgeSearchQuery | null {
  if (queryVector.length !== EMBEDDING_DIMENSIONS || !queryVector.every(Number.isFinite)) return null;
  const t = threshold ?? DEFAULT_MATCH_THRESHOLD;
  const c = count ?? DEFAULT_MATCH_COUNT;
  if (!Number.isFinite(t) || t < -1 || t > 1) return null;
  if (!Number.isInteger(c) || c < 1 || c > MAX_MATCH_COUNT) return null;
  if (category !== undefined && !isKnowledgeBaseCategory(category)) return null;
  return { queryVector, threshold: t, count: c, category: category ?? null };
}

/** pgvector's text input format; PostgREST casts it to vector(1536). */
export function toVectorLiteral(vector: readonly number[]): string {
  return `[${vector.join(',')}]`;
}

/** Runtime guard for one RPC row: the response crosses a network boundary, so its shape is not trusted. */
export function isKnowledgeMatchRow(value: unknown): value is KnowledgeMatchRow {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    isKnowledgeBaseCategory(v.category) &&
    typeof v.title_he === 'string' &&
    typeof v.content_he === 'string' &&
    typeof v.source_reference === 'string' &&
    v.source_reference.trim().length > 0 &&
    typeof v.similarity === 'number' &&
    Number.isFinite(v.similarity)
  );
}

/** Maps a validated RPC row to the app's shape. */
export function toKnowledgeItem(row: KnowledgeMatchRow): KnowledgeItem {
  return { id: row.id, category: row.category, title: row.title_he, content: row.content_he, sourceReference: row.source_reference, similarity: row.similarity };
}
