import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText, Badge } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { BreedMatch } from '../types';
import { formatILS } from '../utils/costs';
import { SIZE_LABELS_HE, TIER_LABELS_HE, TIER_TONES } from '../utils/labels';

const PERCENT_COLOR = { OPTIMAL: 'accentMint', GOOD_WITH_ADJUSTMENTS: 'accentOrange', HIGH_RISK_MISMATCH: 'dangerText' } as const;

/** One ranked breed: score, tier, the first red flag, and a tap through to the dossier. */
export function BreedMatchCard({ match, onOpen }: { match: BreedMatch; onOpen: () => void }) {
  const { breed, tier, matchPercentage, dealBreakersHe, cautionsHe, monthlyCost } = match;
  const headline = dealBreakersHe[0] ?? cautionsHe[0];
  return (
    <PressableScale
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${breed.nameHe}: ${matchPercentage}% התאמה, ${TIER_LABELS_HE[tier]}`}
      accessibilityHint="פתיחת התיק המלא של הגזע"
      style={[styles.card, tier === 'HIGH_RISK_MISMATCH' && styles.risk]}
    >
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="subheading">{breed.nameHe}</AppText>
          <AppText variant="caption" color="textSecondary">{`${breed.nameEn} · ${SIZE_LABELS_HE[breed.size]} · כ־${formatILS(monthlyCost.totalILS)} בחודש`}</AppText>
        </View>
        <AppText variant="title" color={PERCENT_COLOR[tier]}>{`${matchPercentage}%`}</AppText>
      </View>
      <Badge label={TIER_LABELS_HE[tier]} tone={TIER_TONES[tier]} icon={dealBreakersHe.length > 0 ? 'warning-outline' : undefined} />
      {headline ? (
        <View style={styles.row}>
          <Ionicons name={dealBreakersHe.length > 0 ? 'alert-circle' : 'information-circle-outline'} size={18} color={dealBreakersHe.length > 0 ? colors.dangerText : colors.textSecondary} accessible={false} />
          <AppText variant="caption" color={dealBreakersHe.length > 0 ? 'dangerText' : 'textSecondary'} style={styles.flex}>
            {headline}
          </AppText>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  risk: {
    borderColor: colors.danger,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
