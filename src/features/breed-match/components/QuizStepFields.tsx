import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ChipGroup, Disclaimer } from '@/components/ui';
import { spacing } from '@/constants/theme';

import {
  ALLERGY_LABELS,
  ALONE_HOURS_OPTIONS,
  BUDGET_OPTIONS,
  DWELLING_LABELS,
  EXERCISE_MINUTES_OPTIONS,
  EXPERIENCE_LABELS,
  GOAL_LABELS,
  HOUSEHOLD_LABELS,
  HYPOALLERGENIC_NOTE_HE,
  SURROUNDINGS_LABELS,
  type HouseholdKey,
} from '../data/quizOptions';
import type { QuizDraft } from '../utils/quizDraft';

/** Chip options from a label map. */
const fromLabels = <T extends string>(labels: Readonly<Record<T, string>>) => (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
/** Chip options for numeric buckets (chips carry strings). */
const fromNumbers = (options: readonly { value: number; label: string }[]) => options.map(({ value, label }) => ({ value: String(value), label }));

const DWELLING = fromLabels(DWELLING_LABELS);
const SURROUNDINGS = fromLabels(SURROUNDINGS_LABELS);
const EXPERIENCE = fromLabels(EXPERIENCE_LABELS);
const HOUSEHOLD = fromLabels<HouseholdKey>(HOUSEHOLD_LABELS);
const ALLERGY = fromLabels(ALLERGY_LABELS);
const GOAL = fromLabels(GOAL_LABELS);
const ALONE = fromNumbers(ALONE_HOURS_OPTIONS);
const EXERCISE = fromNumbers(EXERCISE_MINUTES_OPTIONS);
const BUDGET = fromNumbers(BUDGET_OPTIONS);

const asText = (value: number | null) => (value === null ? null : String(value));

interface QuizStepFieldsProps {
  step: number;
  draft: QuizDraft;
  update: (patch: Partial<QuizDraft>) => void;
}

/** The questions of one profiler step. */
export function QuizStepFields({ step, draft, update }: QuizStepFieldsProps) {
  switch (step) {
    case 0:
      return (
        <Field label="סוג המגורים">
          <ChipGroup options={DWELLING} value={draft.dwelling} onChange={(dwelling) => update({ dwelling })} accessibilityLabel="סוג המגורים" />
          <AppText variant="label">הסביבה</AppText>
          <ChipGroup options={SURROUNDINGS} value={draft.surroundings} onChange={(surroundings) => update({ surroundings })} accessibilityLabel="הסביבה" />
        </Field>
      );
    case 1:
      return (
        <Field label="כמה שעות ביום הכלב יהיה לבד?">
          <ChipGroup options={ALONE} value={asText(draft.aloneHoursPerDay)} onChange={(value) => update({ aloneHoursPerDay: Number(value) })} accessibilityLabel="שעות לבד ביום" />
          <AppText variant="label">כמה דקות של פעילות אמיתית ביום? (ריצה, משחק, אילוף – לא יציאה לצרכים)</AppText>
          <ChipGroup options={EXERCISE} value={asText(draft.vigorousMinutesPerDay)} onChange={(value) => update({ vigorousMinutesPerDay: Number(value) })} accessibilityLabel="דקות פעילות ביום" />
        </Field>
      );
    case 2:
      return (
        <Field label="הניסיון שלכם">
          <ChipGroup options={EXPERIENCE} value={draft.experience} onChange={(experience) => update({ experience })} accessibilityLabel="ניסיון עם כלבים" />
          <AppText variant="label">מי עוד גר בבית? (אפשר לבחור כמה, או אף אחד)</AppText>
          <ChipGroup<HouseholdKey> multiple options={HOUSEHOLD} value={draft.household} onChange={(household) => update({ household })} accessibilityLabel="מי גר בבית" />
        </Field>
      );
    case 3:
      return (
        <Field label="אלרגיות ושיער בבית">
          <ChipGroup options={ALLERGY} value={draft.allergy} onChange={(allergy) => update({ allergy })} accessibilityLabel="אלרגיות" />
          <Disclaimer>{HYPOALLERGENIC_NOTE_HE}</Disclaimer>
        </Field>
      );
    case 4:
      return (
        <Field label="כמה אפשר להוציא על הכלב בחודש? (אוכל, ביטוח וטיפול מונע, טיפוח)">
          <ChipGroup options={BUDGET} value={asText(draft.monthlyBudgetILS)} onChange={(value) => update({ monthlyBudgetILS: Number(value) })} accessibilityLabel="תקציב חודשי" />
        </Field>
      );
    default:
      return (
        <Field label="המטרה העיקרית">
          <ChipGroup options={GOAL} value={draft.goal} onChange={(goal) => update({ goal })} accessibilityLabel="המטרה העיקרית" />
        </Field>
      );
  }
}

/** A labelled group of answers. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
});
