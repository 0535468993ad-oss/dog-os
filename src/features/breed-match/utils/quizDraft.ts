import type { HouseholdKey } from '../data/quizOptions';
import type { AllergyNeed, Dwelling, Experience, LifestyleProfile, PrimaryGoal, Surroundings } from '../types';

/** The questionnaire while it is being filled: nothing is pre-selected, so every answer is a real choice. */
export interface QuizDraft {
  dwelling: Dwelling | null;
  surroundings: Surroundings | null;
  aloneHoursPerDay: number | null;
  vigorousMinutesPerDay: number | null;
  experience: Experience | null;
  household: HouseholdKey[];
  allergy: AllergyNeed | null;
  monthlyBudgetILS: number | null;
  goal: PrimaryGoal | null;
}

export const QUIZ_STEP_COUNT = 6;

export const EMPTY_DRAFT: QuizDraft = {
  dwelling: null,
  surroundings: null,
  aloneHoursPerDay: null,
  vigorousMinutesPerDay: null,
  experience: null,
  household: [],
  allergy: null,
  monthlyBudgetILS: null,
  goal: null,
};

/** Whether the answers a step asks for are all given (household members are optional). */
export function isStepAnswered(step: number, draft: QuizDraft): boolean {
  switch (step) {
    case 0:
      return draft.dwelling !== null && draft.surroundings !== null;
    case 1:
      return draft.aloneHoursPerDay !== null && draft.vigorousMinutesPerDay !== null;
    case 2:
      return draft.experience !== null;
    case 3:
      return draft.allergy !== null;
    case 4:
      return draft.monthlyBudgetILS !== null;
    case 5:
      return draft.goal !== null;
    default:
      return false;
  }
}

/** The finished profile, or null while any step is unanswered. */
export function toProfile(draft: QuizDraft): LifestyleProfile | null {
  const { dwelling, surroundings, aloneHoursPerDay, vigorousMinutesPerDay, experience, allergy, monthlyBudgetILS, goal } = draft;
  if (dwelling === null || surroundings === null || aloneHoursPerDay === null || vigorousMinutesPerDay === null) return null;
  if (experience === null || allergy === null || monthlyBudgetILS === null || goal === null) return null;
  return {
    dwelling,
    surroundings,
    aloneHoursPerDay,
    vigorousMinutesPerDay,
    experience,
    household: {
      infantsOrToddlers: draft.household.includes('infantsOrToddlers'),
      olderKids: draft.household.includes('olderKids'),
      catsOrSmallPets: draft.household.includes('catsOrSmallPets'),
    },
    allergy,
    monthlyBudgetILS,
    goal,
  };
}
