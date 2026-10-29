import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing, type ColorToken } from '@/constants/theme';

import type { SafetyTier } from '../types';
import { TIER_LABELS } from '../utils/labels';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Accent text on its own tint: emerald 10.8:1, orange 7.0:1, red 4.7:1 (asserted in the theme test).
const TIER_STYLE: Record<SafetyTier, { accent: ColorToken; tint: ColorToken; icon: IconName }> = {
  SAFE: { accent: 'success', tint: 'successMuted', icon: 'checkmark-circle' },
  CAUTION: { accent: 'accentOrange', tint: 'warningMuted', icon: 'alert-circle' },
  TOXIC: { accent: 'accentRed', tint: 'dangerMuted', icon: 'close-circle' },
};

interface SafetyAlertBadgeProps {
  tier: SafetyTier;
  /** The food's name. */
  title: string;
  /** Why – the hazard for toxic foods, the condition for caution, the preparation for safe ones. */
  detailsHe?: string;
}

/** Safety verdict for one food: icon, tier word and name in the tier's accent, then the explanation. */
export function SafetyAlertBadge({ tier, title, detailsHe }: SafetyAlertBadgeProps) {
  const tone = TIER_STYLE[tier];
  return (
    <View
      style={[styles.badge, { backgroundColor: colors[tone.tint], borderColor: colors[tone.accent] }]}
      accessible
      accessibilityRole={tier === 'TOXIC' ? 'alert' : 'text'}
      accessibilityLabel={`${title}: ${TIER_LABELS[tier]}. ${detailsHe ?? ''}`.trim()}
    >
      <View style={styles.header}>
        <Ionicons name={tone.icon} size={22} color={colors[tone.accent]} accessible={false} />
        <AppText variant="label" color={tone.accent}>
          {TIER_LABELS[tier]}
        </AppText>
        <AppText variant="subheading" style={styles.title}>
          {title}
        </AppText>
      </View>
      {detailsHe ? <AppText variant="caption">{detailsHe}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  title: {
    flexShrink: 1,
  },
});
