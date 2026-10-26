import type { AssessmentAnswers } from '@/features/training/types';

// The diagnostic onboarding's contracts: which flow runs, the wizard's steps and state, and where the
// first-run guard sends a signed-in owner.

/** FIRST_RUN: before the main app, once per owner. REASSESS: re-run for one dog from the training tab. */
export type OnboardingMode = 'FIRST_RUN' | 'REASSESS';

export type WizardStep = 'INTRO' | 'DOG' | 'Q_CONTEXT' | 'Q_DRIVES' | 'Q_NERVE' | 'Q_FIELD' | 'RESULT';

/** Answers given so far. */
export type DraftAnswers = { -readonly [K in keyof AssessmentAnswers]?: AssessmentAnswers[K] };

export interface WizardState {
  step: WizardStep;
  /** The dog being assessed; frozen once the first question is shown. */
  assessedDogId: string | null;
  answers: DraftAnswers;
}

export type OnboardingRoute = 'LOADING' | 'ONBOARDING' | 'APP';

/** What the guard needs from the profile query. */
export interface ProfileQueryState {
  isLoading: boolean;
  isError: boolean;
  /** null: the query succeeded but there is no profile row. */
  data: { onboarding_completed: boolean } | null | undefined;
}
