import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ChipGroup, EmptyState, ErrorState, LoadingState, StaleDataNotice, TextField } from '@/components/ui';
import { cacheState } from '@/lib/queryView';
import { spacing } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

import { useBookmarks, useKnowledgeBase } from '../hooks/useKnowledgeBase';
import type { CategoryFilter, MethodFilter } from '../types';
import { categoryOptions, filterArticles, METHOD_OPTIONS } from '../utils/articleSearch';
import { ArticleCard } from './ArticleCard';

/** Training encyclopedia tab: search, category/saved and method filters over the knowledge base. */
export function EncyclopediaTab() {
  const articles = useKnowledgeBase();
  const bookmarks = useBookmarks();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [method, setMethod] = useState<MethodFilter>('all');

  const saved = useMemo(() => new Set(bookmarks.data ?? []), [bookmarks.data]);
  const filtered = useMemo(() => filterArticles(articles.data ?? [], { query, category, method, saved }), [articles.data, saved, query, category, method]);

  if (articles.isLoading) return <LoadingState />;
  const view = cacheState(articles.error, articles.data !== undefined);
  if (view === 'failed') return <ErrorState message={toUserMessage(articles.error)} onRetry={() => void articles.refetch()} />;

  const savedView = category === 'saved';

  return (
    <View style={styles.list}>
      <StaleDataNotice visible={view === 'stale'} onRetry={() => void articles.refetch()} />
      <TextField label="חיפוש באנציקלופדיה" value={query} onChangeText={setQuery} placeholder="למשל: חרדת נטישה, קליקר…" returnKeyType="search" />
      <ChipGroup options={categoryOptions(saved.size)} value={category} onChange={setCategory} accessibilityLabel="סינון לפי קטגוריה" scrollable />
      <ChipGroup options={METHOD_OPTIONS} value={method} onChange={setMethod} accessibilityLabel="סינון לפי שיטה" scrollable />

      <AppText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
        {`${filtered.length} מאמרים`}
      </AppText>

      {filtered.length === 0 ? (
        <EmptyState
          icon={savedView ? 'bookmark-outline' : 'search'}
          title={savedView ? 'אין עדיין מאמרים שמורים' : 'לא נמצאו מאמרים'}
          body={savedView ? 'שמרו מאמרים בלחיצה על סימן הסימנייה.' : 'נסו מילת חיפוש אחרת או הסירו סינון.'}
        />
      ) : (
        filtered.map((article) => <ArticleCard key={article.id} article={article} saved={saved.has(article.id)} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
