import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { spacing } from '@/theme';

/** Two-step delete: a button that reveals a confirmation stating exactly what will be erased. */
export function DeleteDogSection({ dogName, deleting, onDelete }: { dogName: string; deleting: boolean; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) return <Button title="מחיקת הכלב" variant="danger" onPress={() => setConfirming(true)} />;
  return (
    <Card tone="danger">
      <AppText>{`למחוק את ${dogName}? כל הרשומות, האימונים והשיחות של הכלב יימחקו לצמיתות.`}</AppText>
      <View style={styles.row}>
        <Button title="ביטול" variant="secondary" onPress={() => setConfirming(false)} />
        <Button title="מחיקה לצמיתות" variant="danger" loading={deleting} onPress={onDelete} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
