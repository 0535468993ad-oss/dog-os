import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, ChipGroup, DateField, EmptyState, ErrorState, IconButton, LoadingState, Screen, SectionHeader, StaleDataNotice, TextField } from '@/components/ui';
import { cacheState } from '@/lib/queryView';
import { useActiveDog } from '@/features/dogs/hooks';
import type { DogRow, JournalCategory, JournalMood } from '@/lib/database.types';
import { spacing } from '@/constants/theme';
import { formatDate, todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { useJournal, useJournalMutations } from './hooks';
import { JOURNAL_CATEGORY_LABELS, MOOD_LABELS } from './labels';

export function JournalScreen() {
  const { activeDog, isLoading } = useActiveDog();
  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'יומן' }} />
      {isLoading ? <LoadingState /> : activeDog ? <Journal dog={activeDog} /> : <EmptyState icon="paw-outline" title="אין כלב פעיל" />}
    </Screen>
  );
}

function Journal({ dog }: { dog: DogRow }) {
  const journal = useJournal(dog.id);
  const { add, remove } = useJournalMutations(dog.id);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<JournalCategory>('behavior');
  const [mood, setMood] = useState<JournalMood | null>(null);
  const [entryDate, setEntryDate] = useState<string>(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const removeEntry = (id: string) => {
    setListError(null);
    remove.mutate(id, { onError: (e) => setListError(toUserMessage(e, 'מחיקת הרשומה נכשלה. נסו שוב.')) });
  };

  const submit = async () => {
    if (!note.trim()) {
      setError('כתבו מה קרה היום.');
      return;
    }
    setError(null);
    try {
      await add.mutateAsync({ dogId: dog.id, note: note.trim(), category, mood, entryDate });
      setNote('');
      setMood(null);
    } catch (e) {
      setError(toUserMessage(e));
    }
  };

  return (
    <>
      <AppText color="textSecondary">{`רשמו התנהגויות, תסמינים והצלחות של ${dog.name}. היועץ החכם משתמש ברשומות האחרונות כדי להתאים את ההמלצות.`}</AppText>
      <Card>
        <ChipGroup
          options={(Object.keys(JOURNAL_CATEGORY_LABELS) as JournalCategory[]).map((value) => ({ value, label: JOURNAL_CATEGORY_LABELS[value] }))}
          value={category}
          onChange={setCategory}
          accessibilityLabel="קטגוריה"
        />
        <TextField label="מה קרה?" value={note} onChangeText={setNote} multiline maxLength={2000} error={error} placeholder="למשל: נבח על כלב ברחוב פחות מאתמול" />
        <View style={styles.group}>
          <AppText variant="label" color="textSecondary">
            איך היה היום? (רשות)
          </AppText>
          <ChipGroup
            options={(Object.keys(MOOD_LABELS) as JournalMood[]).map((value) => ({ value, label: MOOD_LABELS[value] }))}
            value={mood}
            onChange={setMood}
            accessibilityLabel="מצב רוח"
          />
        </View>
        <DateField label="תאריך" value={entryDate} onChange={setEntryDate} maximumDate={todayIso()} />
        <Button title="הוספה ליומן" onPress={submit} loading={add.isPending} />
      </Card>

      <SectionHeader title="רשומות" />
      {listError ? (
        <AppText color="dangerText" accessibilityRole="alert">
          {listError}
        </AppText>
      ) : null}
      <StaleDataNotice visible={cacheState(journal.error, journal.data !== undefined) === 'stale'} onRetry={() => void journal.refetch()} />
      {journal.isLoading ? (
        <LoadingState />
      ) : cacheState(journal.error, journal.data !== undefined) === 'failed' ? (
        <ErrorState message={toUserMessage(journal.error)} onRetry={() => void journal.refetch()} />
      ) : journal.data?.length ? (
        journal.data.map((entry) => (
          <Card key={entry.id}>
            <View style={styles.row}>
              <View style={styles.badges}>
                <Badge label={JOURNAL_CATEGORY_LABELS[entry.category]} tone="primary" />
                {entry.mood ? <Badge label={MOOD_LABELS[entry.mood]} /> : null}
              </View>
              <IconButton icon="trash-outline" accessibilityLabel={`מחיקת הרשומה מ${formatDate(entry.entry_date)}`} onPress={() => removeEntry(entry.id)} color="textSecondary" />
            </View>
            <AppText variant="caption" color="textSecondary">
              {formatDate(entry.entry_date)}
            </AppText>
            <AppText>{entry.note}</AppText>
          </Card>
        ))
      ) : (
        <EmptyState icon="book-outline" title="היומן ריק" body="רשומה אחת ביום עושה הבדל גדול בהבנת הדפוסים." />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
  },
});
