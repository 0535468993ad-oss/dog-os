import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, TextField } from '@/components/ui';
import { spacing } from '@/theme';

import { DELETE_PHRASE, isDeleteConfirmed } from '../utils/deleteConfirmation';

/** Permanent account deletion behind an explicit typed confirmation. */
export function DeleteAccountPanel({ deleting, onConfirm }: { deleting: boolean; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState('');

  if (!open) return <Button title="מחיקת החשבון" variant="ghost" onPress={() => setOpen(true)} />;

  return (
    <Card tone="danger">
      <AppText variant="subheading" color="dangerText">
        מחיקת חשבון לצמיתות
      </AppText>
      <AppText>כל המידע – כלבים, רשומות בריאות, אימונים, יומן, שיחות ותמונות – יימחק ולא ניתן יהיה לשחזר אותו. מומלץ לייצא את המידע קודם.</AppText>
      <TextField label={`הקלידו ״${DELETE_PHRASE}״ לאישור`} value={phrase} onChangeText={setPhrase} autoCapitalize="none" />
      <View style={styles.actions}>
        <Button title="ביטול" variant="secondary" onPress={() => setOpen(false)} />
        <Button title="מחיקת החשבון" variant="danger" onPress={onConfirm} loading={deleting} disabled={!isDeleteConfirmed(phrase)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
