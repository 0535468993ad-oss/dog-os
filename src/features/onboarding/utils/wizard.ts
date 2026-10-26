import {
  AGE_STAGE_LABELS_HE,
  ASSESSMENT_STEPS,
  CORRECTION_LABELS_HE,
  GOAL_LABELS_HE,
  HANDLER_LABELS_HE,
  LIVING_ENV_LABELS_HE,
  OUTDOOR_FOCUS_LABELS_HE,
  REACTIVITY_LABELS_HE,
  STARTLE_LABELS_HE,
  type AssessmentStep,
} from '@/features/training/data/assessmentQuestions';
import type { AssessmentAnswers, AssessmentKey, DriveLevel, TrainingGoal } from '@/features/training/types';
import { isDriveLevel, isOption, parseAnswers } from '@/features/training/utils/assessmentParse';
import { ageStageFor } from '@/features/training/utils/assessmentProfile';
import { ageInMonths } from '@/utils/date';

import type { DraftAnswers, OnboardingMode, OnboardingRoute, ProfileQueryState, WizardState, WizardStep } from '../types';

// The wizard's pure logic: step order, when a step is complete, typed answer patches, the dog binding
// and the first-run guard. Kept free of React so every rule is unit-tested.

const QUESTION_STEPS: readonly WizardStep[] = ['Q_CONTEXT', 'Q_DRIVES', 'Q_NERVE', 'Q_FIELD'];

/** The steps each flow walks through. A re-assessment knows its dog, so it starts at the questions. */
export const STEP_ORDER: Readonly<Record<OnboardingMode, readonly WizardStep[]>> = {
  FIRST_RUN: ['INTRO', 'DOG', ...QUESTION_STEPS, 'RESULT'],
  REASSESS: [...QUESTION_STEPS, 'RESULT'],
};

/** The questionnaire step shown at a wizard step, if it is one. */
export function questionStepFor(step: WizardStep): AssessmentStep | null {
  return ASSESSMENT_STEPS.find((candidate) => candidate.id === step) ?? null;
}

/** A fresh wizard for the flow, optionally bound to a dog and prefilled. */
export function initialWizard(mode: OnboardingMode, dogId: string | null, answers: DraftAnswers = {}): WizardState {
  return { step: STEP_ORDER[mode][0] ?? 'RESULT', assessedDogId: dogId, answers };
}

/** The age stage the dog's birth date implies, as a prefilled answer (the owner can still change it). */
export function prefillFor(birthDate: string | null, today?: string): DraftAnswers {
  return birthDate ? { ageStage: ageStageFor(ageInMonths(birthDate, today)) } : {};
}

/** Whether a question has an answer. */
function answered(answers: DraftAnswers, key: AssessmentKey): boolean {
  const value = answers[key];
  return Array.isArray(value) ? value.length > 0 : value !== undefined;
}

/** Whether the owner may move on from the current step. */
export function canAdvance(state: WizardState): boolean {
  if (state.step === 'DOG') return state.assessedDogId !== null;
  const questions = questionStepFor(state.step);
  if (questions) return questions.questions.every((question) => answered(state.answers, question.key));
  return state.step === 'INTRO';
}

/** One step forward (when allowed) or back, within the flow. */
export function moveStep(state: WizardState, mode: OnboardingMode, direction: 1 | -1): WizardState {
  if (direction === 1 && !canAdvance(state)) return state;
  const order = STEP_ORDER[mode];
  const next = order[order.indexOf(state.step) + direction];
  return next ? { ...state, step: next } : state;
}

/** Binds the wizard to a dog – only before the questions start, so answers never move to another dog. */
export function chooseDog(state: WizardState, dogId: string | null, prefill: DraftAnswers = {}): WizardState {
  if (state.step !== 'INTRO' && state.step !== 'DOG') return state;
  return { ...state, assessedDogId: dogId, answers: { ...prefill, ...state.answers } };
}

/** The wizard back at the dog step, unbound (the assessed dog no longer exists). */
export function resetToDogStep(state: WizardState): WizardState {
  return { ...state, step: 'DOG', assessedDogId: null };
}

/** Position for the progress bar: 1-based step number and the total. */
export function progressOf(state: WizardState, mode: OnboardingMode): { index: number; total: number } {
  const order = STEP_ORDER[mode];
  return { index: Math.max(0, order.indexOf(state.step)) + 1, total: order.length };
}

const toDrive = (raw: string): DriveLevel | null => {
  const value = Number(raw);
  return isDriveLevel(value) ? value : null;
};

/** The draft with one answer set from the raw chip value(s); an invalid value leaves it unchanged. */
export function patchAnswer(answers: DraftAnswers, key: AssessmentKey, raw: string | readonly string[]): DraftAnswers {
  if (key === 'primaryGoals') {
    const goals = (Array.isArray(raw) ? raw : [raw]).filter((goal): goal is TrainingGoal => isOption(GOAL_LABELS_HE, goal));
    return { ...answers, primaryGoals: goals };
  }
  if (typeof raw !== 'string') return answers;
  switch (key) {
    case 'ageStage':
      return isOption(AGE_STAGE_LABELS_HE, raw) ? { ...answers, ageStage: raw } : answers;
    case 'livingEnv':
      return isOption(LIVING_ENV_LABELS_HE, raw) ? { ...answers, livingEnv: raw } : answers;
    case 'handlerExperience':
      return isOption(HANDLER_LABELS_HE, raw) ? { ...answers, handlerExperience: raw } : answers;
    case 'startleRecovery':
      return isOption(STARTLE_LABELS_HE, raw) ? { ...answers, startleRecovery: raw } : answers;
    case 'correctionSensitivity':
      return isOption(CORRECTION_LABELS_HE, raw) ? { ...answers, correctionSensitivity: raw } : answers;
    case 'outdoorFocus':
      return isOption(OUTDOOR_FOCUS_LABELS_HE, raw) ? { ...answers, outdoorFocus: raw } : answers;
    case 'reactivityType':
      return isOption(REACTIVITY_LABELS_HE, raw) ? { ...answers, reactivityType: raw } : answers;
    case 'foodDrive':
    case 'playPreyDrive':
    case 'energyLevel': {
      const level = toDrive(raw);
      return level === null ? answers : { ...answers, [key]: level };
    }
  }
}

/** A question's current answer as chip value(s), for display. */
export function chipValue(answers: DraftAnswers, key: AssessmentKey): string | string[] | null {
  const value = answers[key];
  if (value === undefined) return null;
  return Array.isArray(value) ? [...value] : String(value);
}

/** The full answer set, once every question is answered and valid. */
export function completeAnswers(answers: DraftAnswers): AssessmentAnswers | null {
  return parseAnswers(answers);
}

/**
 * Where the first-run guard sends the owner. Onboarding is not a privacy gate, so a failed profile query
 * or a missing profile row opens the app rather than trapping the owner.
 */
export function onboardingRoute(query: ProfileQueryState): OnboardingRoute {
  if (query.isLoading) return 'LOADING';
  if (query.isError || !query.data) return 'APP';
  return query.data.onboarding_completed ? 'APP' : 'ONBOARDING';
}
