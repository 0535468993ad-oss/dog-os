import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, radius, spacing } from '@/theme';

const PULSE_MS = 900;

/** Pulse progress (0→1→0, looping) shared by every block in one skeleton, so they breathe in sync. */
function usePulse() {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.set(withRepeat(withTiming(1, { duration: PULSE_MS }), -1, true));
    return () => cancelAnimation(pulse);
  }, [reduceMotion, pulse]);

  return useAnimatedStyle(() => ({ opacity: 1 - pulse.get() * 0.45 }));
}

interface SkeletonProps {
  /** Placeholder layout built from SkeletonBlock elements, shaped like the content that is loading. */
  children: ReactNode;
  /** Announced to screen readers instead of the (meaningless) placeholder shapes. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Content-shaped loading placeholder. It reads as one "loading" element to assistive technology and
 * pulses gently (opacity only, UI thread); under reduced motion it stays still.
 */
export function Skeleton({ children, label = 'טוען…', style }: SkeletonProps) {
  const pulseStyle = usePulse();
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityLiveRegion="polite" style={style}>
      <Animated.View style={[styles.stack, pulseStyle]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {children}
      </Animated.View>
    </View>
  );
}

interface SkeletonBlockProps {
  width?: DimensionValue;
  height?: number;
  /** Circle of `height` diameter, for avatars and icons. */
  round?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One placeholder shape inside a Skeleton. */
export function SkeletonBlock({ width = '100%', height = 14, round, style, testID }: SkeletonBlockProps) {
  return <View testID={testID} style={[styles.block, { width: round ? height : width, height, borderRadius: round ? height / 2 : radius.sm }, style]} />;
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm + spacing.xs,
  },
  block: {
    backgroundColor: colors.surfaceAlt,
  },
});
