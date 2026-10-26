import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { PressableScale } from '@/components/motion';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { comboMultiplier } from '@/features/gamification/utils/combo';

interface ComboArenaProps {
  reps: number;
  combo: number;
  /** The persona's praise for the last rep, or null before the first. */
  praise: string | null;
  onRep: () => void;
  onStuck: () => void;
}

/** "x1", "x2", "x3" or "🔥 FEVER x5". */
const comboLabel = (combo: number) => {
  const multiplier = comboMultiplier(combo);
  return multiplier >= 5 ? `🔥 FEVER x${multiplier}` : `x${multiplier}`;
};

/**
 * The one-handed rep arena: a large thumb button for each successful rep, the live combo with a spring
 * pop, and the "we're stuck" button. Spam protection lives in the scoring rules, not here.
 */
export function ComboArena({ reps, combo, praise, onRep, onStuck }: ComboArenaProps) {
  const reduceMotion = useReducedMotion();
  const pop = useSharedValue(1);
  useEffect(() => {
    if (combo > 0 && !reduceMotion) pop.set(withSequence(withSpring(1.25, { damping: 6 }), withSpring(1, { damping: 12 })));
  }, [combo, pop, reduceMotion]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));
  const fever = comboMultiplier(combo) >= 5;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Animated.View style={[styles.combo, fever && styles.fever, popStyle]}>
          <AppText variant="title" color={fever ? 'accentOrange' : 'accentCyan'} accessibilityLabel={`קומבו ${comboMultiplier(combo)}`}>
            {comboLabel(combo)}
          </AppText>
        </Animated.View>
        <AppText variant="caption" color="textSecondary">{`${reps} חזרות · ${combo} ברצף`}</AppText>
      </View>
      {praise ? (
        <AppText variant="bodyStrong" color="accentMint" accessibilityLiveRegion="polite">
          {praise}
        </AppText>
      ) : null}
      <PressableScale onPress={onRep} style={styles.repButton} accessibilityRole="button" accessibilityLabel="חזרה מוצלחת">
        <AppText variant="subheading" style={styles.repText}>
          + חזרה מוצלחת (Rep)
        </AppText>
      </PressableScale>
      <PressableScale onPress={onStuck} style={styles.stuckButton} accessibilityRole="button" accessibilityLabel="נתקענו – עזרה מיידית">
        <AppText variant="bodyStrong" color="warning">
          נתקענו – עזרה מיידית
        </AppText>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  combo: {
    minWidth: 72,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentCyan,
  },
  fever: {
    borderColor: colors.accentOrange,
  },
  repButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.accentMint,
  },
  repText: {
    color: colors.onAccent,
  },
  stuckButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
});
