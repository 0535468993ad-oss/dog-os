import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedScrollHandler, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

import type { ProtocolStep } from '../utils/protocol';
import { activeStepIndex, focusLineAt } from '../utils/storyScroll';
import { StepProgressDots } from './StepProgressDots';
import { StoryStep } from './StoryStep';

interface ScrollStoryCommandCardProps {
  /** Pinned above the story: stays in view while the steps scroll. */
  banner: ReactNode;
  /** Content before the steps (goal, track switch, gear). */
  intro: ReactNode;
  steps: readonly ProtocolStep[];
  checked: readonly number[];
  onToggleStep: (index: number) => void;
  /** Content after the steps (generalisation, cautions, the live session). */
  children: ReactNode;
}

/**
 * A command told as a scroll story. One scroll offset, on the UI thread, drives every step's illustration,
 * highlight and the progress dots, so scrolling stays at 60 FPS whatever the JS thread is doing.
 */
export function ScrollStoryCommandCard({ banner, intro, steps, checked, onToggleStep, children }: ScrollStoryCommandCardProps) {
  const scrollY = useSharedValue(0);
  const viewport = useSharedValue(0);
  const stepsTop = useSharedValue(0);
  const tops = useSharedValue<number[]>([]);
  const measured = useRef<number[]>([]);
  const [current, setCurrent] = useState(-1);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
    viewport.set(event.layoutMeasurement.height);
  });
  // The focus line in the steps container's own coordinates, where each step measures itself.
  const focusLine = useDerivedValue(() => focusLineAt(scrollY.get(), viewport.get()) - stepsTop.get());
  const active = useDerivedValue(() => activeStepIndex(focusLine.get(), tops.get()));
  // Only a change of step crosses to JS, for the spoken "step X of N".
  useAnimatedReaction(
    () => active.get(),
    (next, previous) => {
      if (next !== previous) scheduleOnRN(setCurrent, next);
    },
  );

  const onMeasure = (index: number, top: number) => {
    const next = Array.from({ length: steps.length }, (_, i) => measured.current[i] ?? Number.NaN);
    next[index] = top;
    measured.current = next;
    tops.set(next);
  };

  return (
    <View style={styles.root}>
      <View style={styles.sticky}>
        {banner}
        {steps.length > 0 ? <StepProgressDots count={steps.length} active={active} current={current} /> : null}
      </View>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(event) => viewport.set(event.nativeEvent.layout.height)}
        contentContainerStyle={styles.content}
      >
        {intro}
        {steps.length > 0 ? (
          <View style={styles.steps} onLayout={(event) => stepsTop.set(event.nativeEvent.layout.y)}>
            <AppText variant="label">שלבי האימון</AppText>
            {steps.map((step, index) => (
              <StoryStep
                key={`${index}-${step.textHe}`}
                index={index}
                step={step}
                checked={checked.includes(index)}
                onToggle={() => onToggleStep(index)}
                focusLine={focusLine}
                onMeasure={onMeasure}
              />
            ))}
          </View>
        ) : null}
        {children}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  sticky: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  steps: {
    gap: spacing.xs,
  },
});
