import type { VetCategory } from '@/lib/database.types';

import type { VetArticle } from '../api';

export interface VetSearchFilter {
  query: string;
  category: VetCategory | 'all';
  /** When set, only articles relevant to this breed. */
  breedId: string | null;
}

/** Lower-cases Latin letters (GDV / gdv) and collapses whitespace, so typing style never hides a match. */
export function normalizeSearch(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Filters encyclopedia articles by category, breed and a free-text query over title, summary, signs and tags. */
export function filterVetArticles(articles: VetArticle[], { query, category, breedId }: VetSearchFilter): VetArticle[] {
  const q = normalizeSearch(query);
  return articles.filter((article) => {
    if (category !== 'all' && article.category !== category) return false;
    if (breedId && !article.breeds.includes(breedId)) return false;
    if (!q) return true;
    return [article.title, article.summary, article.overview, ...article.signs, ...article.tags].some((text) => normalizeSearch(text).includes(q));
  });
}

/** The result count in Hebrew: "ערך אחד", "12 ערכים". */
export function resultCountLabel(count: number): string {
  if (count === 0) return 'אין ערכים';
  return count === 1 ? 'ערך אחד' : `${count} ערכים`;
}

/** Articles shown in the emergency quick-access strip. */
export function emergencyArticles(articles: VetArticle[]): VetArticle[] {
  return articles.filter((article) => article.category === 'emergency');
}
