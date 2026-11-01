import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { SPRINGS } from '@/constants/motion';
import { colors, glow, radius, spacing, tabularNums } from '@/constants/theme';

interface XpFloatingBannerProps {
  /** Changes on every award, so the same amount twice still animates. */
  awardKey: number;
  xp: number;
  multiplier: number;
}

/** A floating "+XP" tag that rises and fades after an award; static and announced under reduced motion. */
export function XpFloatingBanner({ awardKey, xp, multiplier }: XpFloatingBannerProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (awardKey === 0) return;
    progress.set(0);
    progress.set(reduceMotion ? 1 : withSequence(withSpring(1, SPRINGS.ui), withDelay(900, withSpring(2, SPRINGS.ui))));
  }, [awardKey, reduceMotion, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    const opacity = p <= 1 ? p : 2 - p;
    return { opacity, transform: [{ translateY: (1 - Math.min(p, 1)) * 24 - Math.max(0, p - 1) * 24 }] };
  });

  if (awardKey === 0 || xp <= 0) return null;
  const label = multiplier > 1 ? `+${xp} XP · ×${multiplier}` : `+${xp} XP`;
  return (
    <Animated.View style={[styles.banner, style]} pointerEvents="none" accessibilityLiveRegion="polite" accessibilityLabel={`קיבלתם ${xp} נקודות ניסיון`}>
      <AppText variant="heading" style={styles.text}>
        {label}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accentGold,
    zIndex: 10,
    ...glow(colors.accentGold),
  },
  text: {
    ...tabularNums,
    color: colors.onAccent,
  },
});
