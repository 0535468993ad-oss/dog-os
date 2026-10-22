import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText, GlassCard } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { TROPHIES } from '../data/gameRules';
import type { TrophyId } from '../types';

const ORDER = Object.keys(TROPHIES) as TrophyId[];

/** The trophy vault: earned trophies lit, locked ones with what they take. */
export function TrophyVault({ earned }: { earned: readonly TrophyId[] }) {
  return (
    <GlassCard>
      <AppText variant="heading" accessibilityRole="header">
        ארון הגביעים
      </AppText>
      <View style={styles.grid}>
        {ORDER.map((id) => {
          const trophy = TROPHIES[id];
          const won = earned.includes(id);
          return (
            <View key={id} style={[styles.tile, won && styles.won]} accessible accessibilityLabel={`${trophy.nameHe}: ${won ? 'הושג' : 'נעול'}. ${trophy.descriptionHe}`}>
              <Ionicons name={won ? 'trophy' : 'lock-closed-outline'} size={26} color={won ? colors.accentOrange : colors.textMuted} accessible={false} />
              <AppText variant="label" center>
                {trophy.nameHe}
              </AppText>
              <AppText variant="caption" color="textSecondary" center>
                {trophy.descriptionHe}
              </AppText>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  won: {
    borderColor: colors.accentOrange,
  },
});
