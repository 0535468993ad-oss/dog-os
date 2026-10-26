import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppText, ChipGroup } from '@/components/ui';
import { enterAt } from '@/components/motion';
import { spacing } from '@/constants/theme';
import type { AssessmentQuestion, AssessmentStep } from '@/features/training/data/assessmentQuestions';
import type { AssessmentKey } from '@/features/training/types';

import type { DraftAnswers } from '../types';
import { chipValue } from '../utils/wizard';

const SCALE_OPTIONS = (['1', '2', '3', '4', '5'] as const).map((value) => ({ value, label: value }));

interface QuestionStepProps {
  step: AssessmentStep;
  answers: DraftAnswers;
  onAnswer: (key: AssessmentKey, raw: string | readonly string[]) => void;
}

/** One questionnaire step: its title, and each question as a labelled chip group. */
export function QuestionStep({ step, answers, onAnswer }: QuestionStepProps) {
  return (
    <View style={styles.root}>
      <AppText variant="title" accessibilityRole="header">
        {step.titleHe}
      </AppText>
      <AppText color="textSecondary">{step.introHe}</AppText>
      {step.questions.map((question, index) => (
        <Animated.View key={question.key} entering={enterAt(index)} style={styles.question}>
          <AppText variant="subheading">{question.titleHe}</AppText>
          {question.kind === 'scale' && question.scaleEndsHe ? (
            <AppText variant="caption" color="textSecondary">{`1 – ${question.scaleEndsHe[0]} · 5 – ${question.scaleEndsHe[1]}`}</AppText>
          ) : null}
          <QuestionChips question={question} value={chipValue(answers, question.key)} onAnswer={onAnswer} />
        </Animated.View>
      ))}
    </View>
  );
}

/** The chips for one question: single choice, a 1–5 scale, or several goals. */
function QuestionChips({ question, value, onAnswer }: { question: AssessmentQuestion; value: string | string[] | null; onAnswer: QuestionStepProps['onAnswer'] }) {
  const options = question.kind === 'scale' ? SCALE_OPTIONS : Object.entries(question.options ?? {}).map(([optionValue, label]) => ({ value: optionValue, label }));
  if (question.kind === 'multi') {
    return <ChipGroup multiple options={options} value={Array.isArray(value) ? value : []} onChange={(next) => onAnswer(question.key, next)} accessibilityLabel={question.titleHe} />;
  }
  return <ChipGroup options={options} value={typeof value === 'string' ? value : null} onChange={(next) => onAnswer(question.key, next)} accessibilityLabel={question.titleHe} />;
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  question: {
    gap: spacing.xs,
  },
});
