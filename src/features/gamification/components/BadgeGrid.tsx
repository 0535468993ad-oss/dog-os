import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ProgressBar } from '@/components/ui';
import { colors, glow, radius, spacing, tabularNums, type ColorToken } from '@/constants/theme';

import { BADGE_TIER_LABELS_HE } from '../data/badgesData';
import type { Badge, BadgeTier } from '../types';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Metallic medal tones (contrast asserted in theme.test.ts); diamond is brilliant white.
const TIER_COLOR: Readonly<Record<BadgeTier, ColorToken>> = {
  BRONZE: 'medalBronze',
  SILVER: 'medalSilver',
  GOLD: 'medalGold',
  DIAMOND: 'textPrimary',
};

/**
 * Trophy badges with tier, lock state and progress; the toxin badge offers its review step. Unlocked badges
 * get a metallic border and glow in their tier tone; locked ones show what is left to earn.
 */
export function BadgeGrid({ badges, onReviewToxins }: { badges: readonly Badge[]; onReviewToxins: () => void }) {
  return (
    <View style={styles.grid}>
      {badges.map((badge) => {
        const tone = TIER_COLOR[badge.tier];
        const { current, target } = badge.progress;
        return (
          <View
            key={badge.id}
            style={[styles.tile, badge.isUnlocked && [styles.unlocked, { borderColor: colors[tone] }, glow(colors[tone])]]}
            testID={`badge-${badge.id}`}
            accessible={badge.id !== 'toxin_shield'}
            accessibilityLabel={`${badge.titleHe}, ${BADGE_TIER_LABELS_HE[badge.tier]}: ${badge.isUnlocked ? 'הושג' : `${current} מתוך ${target}`}. ${badge.descriptionHe}`}
          >
            <Ionicons name={(badge.isUnlocked ? badge.iconName :'lock-closed-outline') as IconName} size={28} color={badge.isUnlocked ? colors[tone] : colors.textMuted} accessible={false} />
            <AppText variant="label" center>
              {badge.titleHe}
            </AppText>
            <AppText variant="caption" color={tone} center>
              {BADGE_TIER_LABELS_HE[badge.tier]}
            </AppText>
            <AppText variant="caption" color="textSecondary" center>
              {badge.descriptionHe}
            </AppText>
            {badge.isUnlocked ? (
              <View style={styles.earned}>
                <Ionicons name="checkmark-circle" size={14} color={colors[tone]} accessible={false} />
                <AppText variant="caption" color={tone}>
                  הושג
                </AppText>
              </View>
            ) : (
              <>
                <ProgressBar value={current / target} label={`התקדמות ב${badge.titleHe}`} />
                <AppText variant="caption" color="textSecondary" style={tabularNums}>{`${current} / ${target}`}</AppText>
              </>
            )}
            {badge.id === 'toxin_shield' && !badge.isUnlocked ? (
              <Button title="סקירת המזונות הרעילים" variant="tonal" compact icon="nutrition-outline" onPress={onReviewToxins} />
            ) : null}
          </View>
        );
      })}
    </View>
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
    flexBasis: 150,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  unlocked: {
    borderWidth: 2,
  },
  earned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
