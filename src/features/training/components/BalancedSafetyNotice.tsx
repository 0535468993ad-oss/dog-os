import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, Button, Checkbox } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { BALANCED_SAFETY_RULES_HE } from '../data/methodology';
import type { RiskWarning } from '../types';

interface BalancedSafetyNoticeProps {
  /** The warnings for this dog that still need the owner's confirmation. */
  pending: readonly RiskWarning[];
  /** The current version of the safety rules hasn't been confirmed yet. */
  needsRules: boolean;
  onAcknowledge: () => void;
}

/** This dog's warnings and the balanced-track safety rules; the protocols open once the owner confirms them. */
export function BalancedSafetyNotice({ pending, needsRules, onAcknowledge }: BalancedSafetyNoticeProps) {
  const [read, setRead] = useState(false);
  return (
    <View style={styles.box} accessibilityRole="alert">
      {pending.length > 0 ? (
        <>
          <AppText variant="subheading" color="warning">
            אזהרות שמתאימות לכלב הזה
          </AppText>
          <BulletList items={pending.map((warning) => warning.textHe)} />
        </>
      ) : null}
      {needsRules ? (
        <>
          <AppText variant="subheading" color="warning">
            לפני המסלול המאוזן – כללי בטיחות
          </AppText>
          <BulletList items={BALANCED_SAFETY_RULES_HE} />
        </>
      ) : null}
      <Checkbox
        checked={read}
        onChange={setRead}
        label={pending.length > 0 ? 'קראתי את האזהרות, ואשתמש בציוד רק לפי הכללים' : 'קראתי, ואשתמש בציוד רק לפי הכללים האלה'}
      />
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
