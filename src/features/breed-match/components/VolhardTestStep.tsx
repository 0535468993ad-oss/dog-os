import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText, Button, GlassCard, ProgressBar } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/constants/theme';

import type { VolhardScore, VolhardTest } from '../types';

const SCORES: readonly VolhardScore[] = [1, 2, 3, 4, 5, 6];

interface VolhardTestStepProps {
  test: VolhardTest;
  index: number;
  total: number;
  selected: VolhardScore | undefined;
  onScore: (score: VolhardScore) => void;
  onBack: () => void;
}

/** One test: what it measures, how to run it, and the observed behaviour to pick as the score. */
export function VolhardTestStep({ test, index, total, selected, onScore, onBack }: VolhardTestStepProps) {
  return (
    <GlassCard>
      <AppText variant="caption" color="textSecondary">{`מבחן ${index + 1} מתוך ${total}`}</AppText>
      <ProgressBar value={(index + 1) / total} label={`מבחן ${index + 1} מתוך ${total}`} />
      <AppText variant="heading" accessibilityRole="header">
        {test.nameHe}
      </AppText>
      <AppText variant="caption" color="accentCyan">
        {test.measuresHe}
      </AppText>
      <AppText>{test.instructionsHe}</AppText>
      {test.cautionHe ? (
        <View style={styles.caution} accessibilityRole="text">
          <AppText variant="caption" color="warning">
            {test.cautionHe}
          </AppText>
        </View>
      ) : null}
      <AppText variant="label">מה הגור עשה?</AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel={`ציון ל${test.nameHe}`} style={styles.options}>
        {SCORES.map((score) => {
          const text = test.scoreDefinitionsHe[score];
          if (!text) return null;
          const isSelected = selected === score;
          return (
            <PressableScale
              key={score}
              onPress={() => onScore(score)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, checked: isSelected }}
              accessibilityLabel={`${score}: ${text}`}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <AppText variant="bodyStrong" color={isSelected ? 'accentCyan' : 'textSecondary'} style={styles.score}>
                {score}
              </AppText>
              <AppText style={styles.flex}>{text}</AppText>
            </PressableScale>
          );
        })}
      </View>
      {index > 0 ? <Button title="למבחן הקודם" variant="ghost" compact icon="arrow-forward" onPress={onBack} /> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  caution: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningMuted,
  },
  options: {
    gap: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_AREA,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.accentCyan,
  },
  score: {
    width: 20,
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
});
