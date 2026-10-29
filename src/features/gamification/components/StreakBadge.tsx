import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { colors, radius, spacing, tabularNums } from '@/constants/theme';

const PULSE_MS = 700;

interface StreakBadgeProps {
  /** Consecutive training days ending today or yesterday. */
  streak: number;
  /** The XP multiplier the streak earns (1 below three days). */
  multiplier: number;
}

/** The streak flame: pulses while a streak is alive, with the day count and the active multiplier. */
export function StreakBadge({ streak, multiplier }: StreakBadgeProps) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);
  const active = streak > 0;

  useEffect(() => {
    if (!active || reduceMotion) return;
    pulse.set(withRepeat(withTiming(1, { duration: PULSE_MS }), -1, true));
    return () => cancelAnimation(pulse);
  }, [active, reduceMotion, pulse]);

  // Transform and opacity only, on the UI thread; the flame never fades below full contrast.
  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.get() * 0.14 }] }));

  const days = `${streak} ${streak === 1 ? 'יום' : 'ימים'}`;
  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={active ? `רצף של ${days}${multiplier > 1 ? `, מכפיל ${multiplier}` : ''}` : 'אין רצף פעיל'}
    >
      <Animated.View style={[styles.flame, active && styles.flameActive, flameStyle]} testID="streak-flame">
        <Ionicons name={active ? 'flame' : 'flame-outline'} size={22} color={active ? colors.accentOrange : colors.textMuted} accessible={false} />
      </Animated.View>
      <AppText variant="bodyStrong" style={tabularNums}>{`רצף: ${days}`}</AppText>
      {multiplier > 1 ? (
        <View style={styles.chip}>
          <AppText variant="caption" style={[styles.chipText, tabularNums]}>{`×${multiplier}`}</AppText>
        </View>
      ) : (
        <AppText variant="caption" color="textSecondary" style={styles.flex}>
          מכפיל ×1.2 מ־3 ימים, ×1.5 מ־7
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flame: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  flameActive: {
    backgroundColor: colors.warningMuted,
  },
  // Dark text on the orange fill (onAccent on accentOrange is asserted in theme.test.ts).
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.accentOrange,
  },
  chipText: {
    color: colors.onAccent,
  },
  flex: {
    flex: 1,
  },
});
