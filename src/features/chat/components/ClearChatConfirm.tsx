import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

/** Inline confirmation before deleting the whole conversation. */
export function ClearChatConfirm({ onCancel, onConfirm, clearing }: { onCancel: () => void; onConfirm: () => void; clearing: boolean }) {
  return (
    <View style={styles.confirm} accessibilityRole="alert">
      <AppText style={styles.flex}>למחוק את כל השיחה?</AppText>
      <Button title="ביטול" variant="secondary" compact onPress={onCancel} />
      <Button title="מחיקה" variant="danger" compact onPress={onConfirm} loading={clearing} />
    </View>
  );
}

const styles = StyleSheet.create({
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
  },
  flex: {
    flex: 1,
  },
});
