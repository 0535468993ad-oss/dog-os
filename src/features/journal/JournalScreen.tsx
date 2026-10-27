import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import { AppText, EmptyState, ErrorState, LoadingState, Screen, SectionHeader, StaleDataNotice } from '@/components/ui';
import { MAX_CONTENT_WIDTH } from '@/components/ui/Screen';
import { spacing } from '@/constants/theme';
import { useActiveDog } from '@/features/dogs/hooks';
import type { DogRow } from '@/lib/database.types';
import { cacheState } from '@/lib/queryView';
import { toUserMessage } from '@/utils/errors';

import { JournalEntryCard } from './components/JournalEntryCard';
import { JournalForm } from './components/JournalForm';
import { useJournalFeed, useJournalMutations } from './hooks/useJournal';
import type { JournalEntryRow } from './types';

/** The journal: a form for today's entry above the dog's entries, paged from the server as the list scrolls. */
export function JournalScreen() {
  const { activeDog, isLoading } = useActiveDog();
  return (
    <Screen edges={['bottom']} scroll={false}>
      <Stack.Screen options={{ title: 'יומן' }} />
      {isLoading ? <LoadingState /> : activeDog ? <Journal dog={activeDog} /> : <EmptyState icon="paw-outline" title="אין כלב פעיל" />}
    </Screen>
  );
}

const entryKey = (entry: JournalEntryRow) => entry.id;

function Journal({ dog }: { dog: DogRow }) {
  const feed = useJournalFeed(dog.id);
  const { add, remove } = useJournalMutations(dog.id);
  const [listError, setListError] = useState<string | null>(null);
  const deleteEntry = remove.mutate;

  // Stable, so the memoized entry cards skip re-rendering when the list re-renders.
  const removeEntry = useCallback(
    (id: string) => {
      setListError(null);
      deleteEntry(id, { onError: (e) => setListError(toUserMessage(e, 'מחיקת הרשומה נכשלה. נסו שוב.')) });
    },
    [deleteEntry],
  );
  const renderEntry = useCallback<ListRenderItem<JournalEntryRow>>(({ item }) => <JournalEntryCard entry={item} onDelete={removeEntry} />, [removeEntry]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const view = cacheState(feed.error, feed.data !== undefined);
  const retry = () => void feed.refetch();

  return (
    <FlatList
      data={view === 'failed' ? [] : (feed.data ?? [])}
      keyExtractor={entryKey}
      renderItem={renderEntry}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      accessibilityLabel="רשומות היומן"
      ListHeaderComponent={
        <View style={styles.header}>
          <AppText color="textSecondary">{`רשמו התנהגויות, תסמינים והצלחות של ${dog.name}. היועץ החכם משתמש ברשומות האחרונות כדי להתאים את ההמלצות.`}</AppText>
          <JournalForm dogId={dog.id} onAdd={add.mutateAsync} adding={add.isPending} />
          <SectionHeader title="רשומות" />
          {listError ? (
            <AppText color="dangerText" accessibilityRole="alert">
              {listError}
            </AppText>
          ) : null}
          <StaleDataNotice visible={view === 'stale'} onRetry={retry} />
        </View>
      }
      ListEmptyComponent={
        feed.isLoading ? (
          <LoadingState />
        ) : view === 'failed' ? (
          <ErrorState message={toUserMessage(feed.error)} onRetry={retry} />
        ) : (
          <EmptyState icon="book-outline" title="היומן ריק" body="רשומה אחת ביום עושה הבדל גדול בהבנת הדפוסים." />
        )
      }
      ListFooterComponent={isFetchingNextPage ? <LoadingState /> : undefined}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  header: {
    gap: spacing.md,
  },
});
