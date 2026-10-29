import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, MIN_TOUCH_AREA, shadow, spacing } from '@/constants/theme';

import { MOTION, PressableScale } from '../motion';
import { AppText } from './AppText';

// The track's corner, and the pill's: the track radius minus its 4pt padding, so the curves stay concentric.
const TRACK_RADIUS = 12;
const PILL_RADIUS = TRACK_RADIUS - spacing.xs + 1;

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/**
 * Tab switcher on a recessed track; the selected segment is an amber pill whose indicator fades and scales
 * in on the UI thread. Segments keep the 44pt touch target, so the track is 52 tall.
 */
export function SegmentedControl<T extends string>({ segments, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  return (
    <View style={styles.container} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {segments.map((segment) => (
        <SegmentButton key={segment.value} label={segment.label} selected={segment.value === value} onPress={() => onChange(segment.value)} />
      ))}
    </View>
  );
}

/** One segment. The indicator is a per-segment layer, so it needs no measuring and is direction-agnostic (RTL/LTR). */
function SegmentButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    progress.set(reduceMotion ? target : withTiming(target, { duration: MOTION.durations.base }));
  }, [selected, reduceMotion, progress]);

  const indicatorStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return { opacity: p, transform: [{ scale: interpolate(p, [0, 1], [0.92, 1]) }] };
  });

  return (
    <PressableScale onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={label} style={styles.segment}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.indicator, indicatorStyle]} accessible={false} />
      <AppText variant="label" style={{ color: selected ? colors.onPrimary : colors.textSecondary }} numberOfLines={1}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: TRACK_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    gap: spacing.xxs,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH_AREA,
    borderRadius: PILL_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  indicator: {
    borderRadius: PILL_RADIUS,
    backgroundColor: colors.primary,
    ...shadow.sm,
  },
});
