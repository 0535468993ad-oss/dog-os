import type { Json } from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';

import type { ArticleStep, KnowledgeArticle } from '../types';

/** Article steps from their JSON column; malformed entries are dropped. */
function parseSteps(value: Json): ArticleStep[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (item && typeof item === 'object' && !Array.isArray(item) && typeof item.title === 'string' && typeof item.body === 'string') {
      return [{ title: item.title, body: item.body }];
    }
    return [];
  });
}

/** The encyclopedia, in display order. */
export async function fetchKnowledgeBase(): Promise<KnowledgeArticle[]> {
  const rows = unwrap(await supabase.from('training_knowledge_base').select('*').order('sort_order'));
  return rows.map((row) => ({ ...row, steps: parseSteps(row.steps) }));
}

/** Ids of the signed-in user's bookmarked articles. */
export async function fetchBookmarks(): Promise<string[]> {
  const rows = unwrap(await supabase.from('knowledge_bookmarks').select('article_id'));
  return rows.map((row) => row.article_id);
}

/** Adds (idempotent) or removes a bookmark. */
export async function setBookmarked(articleId: string, bookmarked: boolean): Promise<void> {
  if (bookmarked) {
    unwrap(await supabase.from('knowledge_bookmarks').upsert({ article_id: articleId }, { onConflict: 'user_id,article_id', ignoreDuplicates: true }));
  } else {
    unwrap(await supabase.from('knowledge_bookmarks').delete().eq('article_id', articleId));
  }
}
