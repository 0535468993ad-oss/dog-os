import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { CareUrgency } from '@/lib/database.types';
import { colors, radius, spacing, type ColorToken } from '@/constants/theme';

import { TRIAGE_REASON_HE, URGENCY } from '../labels';
import type { TriageReason } from '../logic/symptomTriage';

const VERDICT_COLORS: Record<CareUrgency, { bg: ColorToken; fg: ColorToken }> = {
  emergency: { bg: 'dangerMuted', fg: 'dangerText' },
  vet_visit: { bg: 'warningMuted', fg: 'warning' },
  home_care: { bg: 'successMuted', fg: 'success' },
};

/** Announced urgency verdict (text + icon + color) with what to do next and why. */
export function UrgencyVerdict({ urgency, reason }: { urgency: CareUrgency; reason: TriageReason }) {
  const palette = VERDICT_COLORS[urgency];
  return (
    <View
      style={[styles.verdict, { backgroundColor: colors[palette.bg], borderStartColor: colors[palette.fg] }]}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      testID="urgency-verdict"
    >
      <Ionicons name={URGENCY[urgency].icon} size={28} color={colors[palette.fg]} accessible={false} />
      <View style={styles.flex}>
        <AppText variant="heading" color={palette.fg}>
          {`רמת דחיפות: ${URGENCY[urgency].label}`}
        </AppText>
        <AppText variant="bodyStrong">{URGENCY[urgency].action}</AppText>
        <AppText variant="caption" color="textSecondary">
          {TRIAGE_REASON_HE[reason]}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  verdict: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    // Same start-edge accent bar as toned cards, in the verdict's own color.
    borderStartWidth: 3,
  },
  flex: {
    flex: 1,
    gap: spacing.xxs,
  },
});
