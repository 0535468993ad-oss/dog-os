import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { NerveProfile, TroubleshootingEntry } from '../types';
import { troubleshootingFor } from '../utils/protocol';

interface TroubleshootingListProps {
  entries: readonly TroubleshootingEntry[];
  dogName: string;
  nerve: NerveProfile | null;
  /** The owner is on the balanced track with access granted (the sensitive-dog rule is applied inside). */
  balancedOpen: boolean;
}

/** Common mistakes and their fixes, this dog's profile first; balanced escalations only where allowed. */
export function TroubleshootingList({ entries, dogName, nerve, balancedOpen }: TroubleshootingListProps) {
  const shown = troubleshootingFor(entries, nerve, balancedOpen);
  return (
    <View style={styles.root}>
      <AppText variant="label">טעויות נפוצות ומה עושים</AppText>
      {shown.map((entry) => (
        <View key={entry.commonMistake} style={[styles.entry, entry.highlighted && styles.highlighted]} accessibilityRole="text">
          {entry.highlighted ? (
            <View style={styles.badge}>
              <Ionicons name="paw" size={12} color={colors.primary} accessible={false} />
              <AppText variant="caption" color="primary">
                {`רלוונטי במיוחד ל${dogName}`}
              </AppText>
            </View>
          ) : null}
          <AppText variant="bodyStrong">{entry.commonMistake}</AppText>
          <AppText>{entry.correctionOrAdjustment}</AppText>
          {entry.balancedEscalation ? (
            <View style={styles.escalation}>
              <AppText variant="caption" color="warning">
                במסלול המאוזן, רק להתנהגות שהכלב כבר מכיר:
              </AppText>
              <AppText variant="caption">{entry.balancedEscalation}</AppText>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  entry: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlighted: {
    borderColor: colors.accentBronze,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
  },
  escalation: {
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningMuted,
  },
});
