import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card, IconButton } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { formatDate } from '@/utils/date';

import { JOURNAL_CATEGORY_LABELS, MOOD_LABELS } from '../data/labels';
import type { JournalEntryRow } from '../types';

interface JournalEntryCardProps {
  entry: JournalEntryRow;
  onDelete: (id: string) => void;
}

/** One journal entry in the list. Memoized: the list re-renders as pages load and entries change. */
export const JournalEntryCard = memo(function JournalEntryCard({ entry, onDelete }: JournalEntryCardProps) {
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.badges}>
          <Badge label={JOURNAL_CATEGORY_LABELS[entry.category]} tone="primary" />
          {entry.mood ? <Badge label={MOOD_LABELS[entry.mood]} /> : null}
        </View>
        <IconButton icon="trash-outline" accessibilityLabel={`מחיקת הרשומה מ${formatDate(entry.entry_date)}`} onPress={() => onDelete(entry.id)} color="textSecondary" />
      </View>
      <AppText variant="caption" color="textSecondary">
        {formatDate(entry.entry_date)}
      </AppText>
      <AppText>{entry.note}</AppText>
    </Card>
  );
});

const styles = StyleSheet.create({
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
