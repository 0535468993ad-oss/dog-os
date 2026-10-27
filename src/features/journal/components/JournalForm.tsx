import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ChipGroup, DateField, TextField } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { JOURNAL_CATEGORY_LABELS, MOOD_LABELS } from '../data/labels';
import type { JournalCategory, JournalInput, JournalMood } from '../types';

const CATEGORY_OPTIONS = (Object.keys(JOURNAL_CATEGORY_LABELS) as JournalCategory[]).map((value) => ({ value, label: JOURNAL_CATEGORY_LABELS[value] }));
const MOOD_OPTIONS = (Object.keys(MOOD_LABELS) as JournalMood[]).map((value) => ({ value, label: MOOD_LABELS[value] }));

interface JournalFormProps {
  dogId: string;
  onAdd: (input: JournalInput) => Promise<void>;
  adding: boolean;
}

/** The new-entry form. It owns its draft state, so typing a note never re-renders the entry list. */
export function JournalForm({ dogId, onAdd, adding }: JournalFormProps) {
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<JournalCategory>('behavior');
  const [mood, setMood] = useState<JournalMood | null>(null);
  const [entryDate, setEntryDate] = useState<string>(todayIso());
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!note.trim()) {
      setError('כתבו מה קרה היום.');
      return;
    }
    setError(null);
    try {
      await onAdd({ dogId, note: note.trim(), category, mood, entryDate });
      setNote('');
      setMood(null);
    } catch (e) {
      setError(toUserMessage(e));
    }
  };

  return (
    <Card>
      <ChipGroup options={CATEGORY_OPTIONS} value={category} onChange={setCategory} accessibilityLabel="קטגוריה" />
      <TextField label="מה קרה?" value={note} onChangeText={setNote} multiline maxLength={2000} error={error} placeholder="למשל: נבח על כלב ברחוב פחות מאתמול" />
      <View style={styles.group}>
        <AppText variant="label" color="textSecondary">
          איך היה היום? (רשות)
        </AppText>
        <ChipGroup options={MOOD_OPTIONS} value={mood} onChange={setMood} accessibilityLabel="מצב רוח" />
      </View>
      <DateField label="תאריך" value={entryDate} onChange={setEntryDate} maximumDate={todayIso()} />
      <Button title="הוספה ליומן" onPress={submit} loading={adding} />
    </Card>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
});
