import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useReducedMotion, type SharedValue } from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

interface StepProgressDotsProps {
  count: number;
  /** The step in focus, updated on the UI thread as the story scrolls (-1 before the first step). */
  active: SharedValue<number>;
  /** The same index on the JS side, for the visible and spoken "step X of N". */
  current: number;
}

/** One dot: fills once the reader reaches its step, and grows while its step is in focus. */
function Dot({ index, active, reduceMotion }: { index: number; active: SharedValue<number>; reduceMotion: boolean }) {
  const fill = useAnimatedStyle(() => {
    const reached = active.get() >= index ? 1 : 0;
    const current = active.get() === index ? 1 : 0;
    return {
      opacity: interpolate(reached, [0, 1], [0, 1]),
      transform: [{ scale: reduceMotion ? 1 : interpolate(current, [0, 1], [1, 1.35]) }],
    };
  });
  return (
    <View style={styles.dot}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

/** Step indicator for the command story: dots that fill as the steps scroll by, with the step count as text. */
export function StepProgressDots({ count, active, current }: StepProgressDotsProps) {
  const reduceMotion = useReducedMotion();
  const label = `שלב ${Math.max(0, current) + 1} מתוך ${count}`;
  return (
    <View style={styles.root} accessible accessibilityRole="progressbar" accessibilityLabel={`התקדמות בשלבים: ${label}`}>
      <View style={styles.dots} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {Array.from({ length: count }, (_, index) => (
          <Dot key={index} index={index} active={active} reduceMotion={reduceMotion} />
        ))}
      </View>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
    </View>
  );
}

const DOT = 10;

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    borderRadius: DOT / 2,
    backgroundColor: colors.accentCyan,
  },
});
