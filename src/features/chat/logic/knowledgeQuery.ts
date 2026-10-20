import type { Json, KnowledgeBaseCategory, KnowledgeMatchRow } from '@/lib/database.types';

/** Must match vector(1536) in supabase/migrations/20261019150000_canine_knowledge_base.sql. */
export const EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_MATCH_THRESHOLD = 0.75;
export const DEFAULT_MATCH_COUNT = 5;
/** The RPC clamps to this too (HNSW ef_search limit); validating here surfaces the mistake instead. */
export const MAX_MATCH_COUNT = 40;

export const KNOWLEDGE_BASE_CATEGORIES: readonly KnowledgeBaseCategory[] = ['nutrition', 'triage', 'breed_traits', 'behavior', 'vaccinations'];

export interface KnowledgeSearchQuery {
  queryVector: number[];
  /** Minimum cosine similarity, -1..1. */
  threshold: number;
  /** Maximum number of results, 1..MAX_MATCH_COUNT. */
  count: number;
  category: KnowledgeBaseCategory | null;
}

export interface KnowledgeItem {
  id: string;
  category: KnowledgeBaseCategory;
  title: string;
  content: string;
  metadata: { [key: string]: Json | undefined };
  /** Cosine similarity to the query, -1..1 (higher is closer). */
  similarity: number;
}

export function isKnowledgeBaseCategory(value: unknown): value is KnowledgeBaseCategory {
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
export function isKnowledgeMatchRow(value: unknown): value is KnowledgeMatchRow & { metadata: KnowledgeItem['metadata'] } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    isKnowledgeBaseCategory(v.category) &&
    typeof v.title === 'string' &&
    typeof v.content === 'string' &&
    !!v.metadata &&
    typeof v.metadata === 'object' &&
    !Array.isArray(v.metadata) &&
    typeof v.similarity === 'number' &&
    Number.isFinite(v.similarity)
  );
}
