import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, Button, Checkbox } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { BALANCED_SAFETY_RULES_HE } from '../data/methodology';

/** The balanced-track safety rules; the track's protocols open only after the owner confirms them. */
export function BalancedSafetyNotice({ onAcknowledge }: { onAcknowledge: () => void }) {
  const [read, setRead] = useState(false);
  return (
    <View style={styles.box} accessibilityRole="alert">
      <AppText variant="subheading" color="warning">
        לפני המסלול המאוזן – כללי בטיחות
      </AppText>
      <BulletList items={BALANCED_SAFETY_RULES_HE} />
      <Checkbox checked={read} onChange={setRead} label="קראתי, ואשתמש בציוד רק לפי הכללים האלה" />
      <Button title="פתיחת המסלול המאוזן" variant="secondary" onPress={onAcknowledge} disabled={!read} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningMuted,
  },
});
