import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { AppText, Checkbox } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { ProtocolStep } from '../utils/protocol';
import { stepFocus } from '../utils/storyScroll';

interface StoryStepProps {
  index: number;
  step: ProtocolStep;
  checked: boolean;
  onToggle: () => void;
  /** The focus line in the steps container's coordinates, driven by the scroll offset. */
  focusLine: SharedValue<number>;
  /** Reports this step's position so the story knows which step is active. */
  onMeasure: (index: number, top: number) => void;
}

const MEDALLION = 40;

/**
 * One step of the command story. Its illustration scales and brightens as the step reaches the focus line,
 * and a highlight fades in behind it. The text itself never fades, so it keeps AA contrast throughout.
 */
export function StoryStep({ index, step, checked, onToggle, focusLine, onMeasure }: StoryStepProps) {
  const reduceMotion = useReducedMotion();
  const top = useSharedValue(Number.NaN);
  const height = useSharedValue(0);

  const medallionStyle = useAnimatedStyle(() => {
    const focus = Number.isNaN(top.get()) ? 1 : stepFocus(focusLine.get(), top.get(), height.get());
    return {
      opacity: interpolate(focus, [0, 1], [0.5, 1]),
      transform: [{ scale: reduceMotion ? 1 : interpolate(focus, [0, 1], [0.82, 1.08]) }],
    };
  });
  const highlightStyle = useAnimatedStyle(() => ({
    opacity: Number.isNaN(top.get()) ? 0 : stepFocus(focusLine.get(), top.get(), height.get()),
  }));

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const { y, height: h } = event.nativeEvent.layout;
        top.set(y);
        height.set(h);
        onMeasure(index, y);
      }}
    >
      <Animated.View style={[styles.highlight, highlightStyle]} pointerEvents="none" />
      <Animated.View style={[styles.medallion, medallionStyle]} accessible={false} importantForAccessibility="no-hide-descendants">
        <Ionicons name={checked ? 'checkmark-circle' : 'paw'} size={22} color={checked ? colors.accentMint : colors.accentCyan} accessible={false} />
      </Animated.View>
      <View style={styles.body}>
        <Checkbox checked={checked} onChange={onToggle} label={`שלב ${index + 1}${step.titleHe ? `: ${step.titleHe}` : ''}`}>
          {step.titleHe ? <AppText variant="bodyStrong">{`${index + 1}. ${step.titleHe}`}</AppText> : null}
          <AppText>{step.titleHe ? step.textHe : `${index + 1}. ${step.textHe}`}</AppText>
          {step.handlerMechanics ? <AppText variant="caption" color="textSecondary">{`ידיים, רצועה וגוף: ${step.handlerMechanics}`}</AppText> : null}
          {step.markerCue ? <AppText variant="caption" color="accentMint">{`"${step.markerWord ?? 'כן!'}" – ${step.markerCue}`}</AppText> : null}
        </Checkbox>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  medallion: {
    width: MEDALLION,
    height: MEDALLION,
    borderRadius: MEDALLION / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: {
    flex: 1,
  },
});
