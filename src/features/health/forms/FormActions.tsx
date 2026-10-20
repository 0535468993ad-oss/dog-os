import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

import { SubmitError } from './SubmitError';

interface FormActionsProps {
  onSave: () => void;
  saving: boolean;
  /** Present for existing records; deletion asks for confirmation first. */
  onDelete?: () => Promise<void>;
  deleting?: boolean;
}

/** Save button plus a two-step delete that reports failures instead of swallowing them. */
export function FormActions({ onSave, saving, onDelete, deleting }: FormActionsProps) {
  const [confirm, setConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Runs the delete and shows any failure under the buttons.
  const runDelete = async () => {
    if (!onDelete) return;
    setDeleteError(null);
    try {
      await onDelete();
    } catch (error) {
      setDeleteError(toUserMessage(error, 'המחיקה נכשלה. נסו שוב.'));
    }
  };

  return (
    <View style={styles.actions}>
      <Button title="שמירה" onPress={onSave} loading={saving} fullWidth />
      {onDelete ? (
        confirm ? (
          <View style={styles.row}>
            <Button title="ביטול" variant="secondary" onPress={() => setConfirm(false)} />
            <Button title="מחיקה לצמיתות" variant="danger" onPress={runDelete} loading={deleting} />
          </View>
        ) : (
          <Button title="מחיקה" variant="danger" onPress={() => setConfirm(true)} />
        )
      ) : null}
      <SubmitError message={deleteError} />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
