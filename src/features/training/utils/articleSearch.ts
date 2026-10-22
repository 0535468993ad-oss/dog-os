import type { KnowledgeCategory, TrainingMethod } from '@/lib/database.types';

import type { KnowledgeArticle } from '../api';
import { KNOWLEDGE_CATEGORY_LABELS, METHOD_LABELS } from '../labels';

export type CategoryFilter = KnowledgeCategory | 'all' | 'saved';
export type MethodFilter = TrainingMethod | 'all';

export interface ArticleFilter {
  query: string;
  category: CategoryFilter;
  method: MethodFilter;
  /** Ids of the user's bookmarked articles (for the "saved" filter). */
  saved: ReadonlySet<string>;
}

/** Filters encyclopedia articles by saved/category, method and a free-text query. */
export function filterArticles(articles: KnowledgeArticle[], { query, category, method, saved }: ArticleFilter): KnowledgeArticle[] {
  const q = query.trim();
  return articles.filter((article) => {
    if (category === 'saved' && !saved.has(article.id)) return false;
    if (category !== 'all' && category !== 'saved' && article.category !== category) return false;
    if (method !== 'all' && !article.methods.includes(method)) return false;
    if (!q) return true;
    return [article.title, article.summary, article.principles, article.historical_context].some((text) => text.includes(q));
  });
}

/** Category filter chips: all, saved (with count), then every knowledge category. */
export function categoryOptions(savedCount: number): { value: CategoryFilter; label: string }[] {
  return [
    { value: 'all', label: 'הכל' },
    { value: 'saved', label: `שמורים (${savedCount})` },
    ...(Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]).map((value) => ({ value, label: KNOWLEDGE_CATEGORY_LABELS[value] })),
  ];
}

/** Method filter chips: all methods, then each training method. */
export const METHOD_OPTIONS: { value: MethodFilter; label: string }[] = [
  { value: 'all', label: 'כל השיטות' },
  ...(Object.keys(METHOD_LABELS) as TrainingMethod[]).map((value) => ({ value, label: METHOD_LABELS[value] })),
];
