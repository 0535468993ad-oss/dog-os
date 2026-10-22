import { StyleSheet, View } from 'react-native';

import { AppText, Button, GlassCard, ProgressBar } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { QUIZ_STEP_TITLES_HE } from '../data/quizOptions';
import { useLifestyleQuiz } from '../hooks/useLifestyleQuiz';
import { MatchResults } from './MatchResults';
import { QuizStepFields } from './QuizStepFields';

/** Tab 1: the six-step lifestyle profiler, then the ranked breeds. */
export function LifestyleQuiz() {
  const quiz = useLifestyleQuiz();

  if (quiz.ranking) {
    return <MatchResults matches={quiz.ranking.matches} excludedCount={quiz.ranking.excludedCount} onEdit={quiz.edit} onRestart={quiz.restart} />;
  }

  const isLast = quiz.step === quiz.stepCount - 1;
  return (
    <GlassCard>
      <AppText variant="caption" color="textSecondary">{`שלב ${quiz.step + 1} מתוך ${quiz.stepCount}`}</AppText>
      <ProgressBar value={(quiz.step + 1) / quiz.stepCount} label={`שלב ${quiz.step + 1} מתוך ${quiz.stepCount}`} />
      <AppText variant="heading" accessibilityRole="header">
        {QUIZ_STEP_TITLES_HE[quiz.step]}
      </AppText>
      <QuizStepFields step={quiz.step} draft={quiz.draft} update={quiz.update} />
      <View style={styles.nav}>
        {quiz.step > 0 ? <Button title="הקודם" variant="secondary" onPress={quiz.back} /> : null}
        <View style={styles.spacer} />
        <Button title={isLast ? 'הצגת ההתאמות' : 'הבא'} onPress={quiz.next} disabled={!quiz.canAdvance} accessibilityHint={quiz.canAdvance ? undefined : 'צריך לענות על השאלות בשלב הזה'} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
});
