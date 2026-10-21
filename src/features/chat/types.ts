import type { KnowledgeChunkCategory } from '@/lib/database.types';

export interface KnowledgeSearchQuery {
  queryVector: number[];
  /** Minimum cosine similarity, -1..1. */
  threshold: number;
  /** Maximum number of results, 1..MAX_MATCH_COUNT. */
  count: number;
  category: KnowledgeChunkCategory | null;
}

/** One verified knowledge chunk as the app uses it. */
export interface KnowledgeItem {
  id: string;
  category: KnowledgeChunkCategory;
  title: string;
  content: string;
  /** Where the content comes from; every chunk the advisor cites carries one. */
  sourceReference: string;
  /** Cosine similarity to the query, -1..1 (higher is closer). */
  similarity: number;
}

export type KnowledgeBaseErrorCode = 'invalid_query' | 'schema_missing' | 'network' | 'internal';
