import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { CareUrgency } from '@/lib/database.types';
import { colors, radius, spacing, type ColorToken } from '@/theme';

import { URGENCY } from '../labels';

const VERDICT_COLORS: Record<CareUrgency, { bg: ColorToken; fg: ColorToken }> = {
  emergency: { bg: 'dangerMuted', fg: 'dangerText' },
  vet_visit: { bg: 'warningMuted', fg: 'warning' },
  home_care: { bg: 'successMuted', fg: 'success' },
};

/** Announced urgency verdict (text + icon + color) with what to do next. */
export function UrgencyVerdict({ urgency }: { urgency: CareUrgency }) {
  const palette = VERDICT_COLORS[urgency];
  return (
    <View style={[styles.verdict, { backgroundColor: colors[palette.bg] }]} accessible accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Ionicons name={URGENCY[urgency].icon} size={28} color={colors[palette.fg]} accessible={false} />
      <View style={styles.flex}>
        <AppText variant="heading" color={palette.fg}>
          {`רמת דחיפות: ${URGENCY[urgency].label}`}
        </AppText>
        <AppText>{URGENCY[urgency].action}</AppText>
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
  },
  flex: {
    flex: 1,
  },
});
