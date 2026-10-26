// The onboarding wizard's pure rules: step order and completeness, typed answer patches, the frozen dog
// binding, and the first-run guard (which fails open).
import { makeAnswers } from '@/test/fixtures';

import {
  STEP_ORDER,
  canAdvance,
  chipValue,
  chooseDog,
  completeAnswers,
  initialWizard,
  moveStep,
  onboardingRoute,
  patchAnswer,
  prefillFor,
  progressOf,
  resetToDogStep,
} from '../utils/wizard';

describe('step order and progress', () => {
  it('walks intro → dog → four question steps → result on first run, and skips the first two when re-assessing', () => {
    expect(STEP_ORDER.FIRST_RUN).toEqual(['INTRO', 'DOG', 'Q_CONTEXT', 'Q_DRIVES', 'Q_NERVE', 'Q_FIELD', 'RESULT']);
    expect(initialWizard('REASSESS', 'd1').step).toBe('Q_CONTEXT');
    expect(progressOf(initialWizard('FIRST_RUN', null), 'FIRST_RUN')).toEqual({ index: 1, total: 7 });
  });

  it('moves forward only from a complete step, and back freely', () => {
    let state = initialWizard('FIRST_RUN', null);
    state = moveStep(state, 'FIRST_RUN', 1);
    expect(state.step).toBe('DOG');
    expect(moveStep(state, 'FIRST_RUN', 1).step).toBe('DOG');
    state = moveStep(chooseDog(state, 'd1'), 'FIRST_RUN', 1);
    expect(state.step).toBe('Q_CONTEXT');
    expect(canAdvance(state)).toBe(false);
    state = { ...state, answers: { ageStage: 'ADULT_1_7Y', livingEnv: 'QUIET_APT', handlerExperience: 'FIRST_TIME' } };
    expect(moveStep(state, 'FIRST_RUN', 1).step).toBe('Q_DRIVES');
    expect(moveStep(state, 'FIRST_RUN', -1).step).toBe('DOG');
  });

  it('needs at least one goal to finish the last question step', () => {
    const state = { step: 'Q_FIELD' as const, assessedDogId: 'd1', answers: { outdoorFocus: 'HIGH_CHECK_IN' as const, reactivityType: 'CALM_SOCIAL' as const, primaryGoals: [] } };
    expect(canAdvance(state)).toBe(false);
    expect(canAdvance({ ...state, answers: { ...state.answers, primaryGoals: ['CONFIDENCE_BUILDING'] } })).toBe(true);
  });
});

describe('the assessed dog', () => {
  it('is frozen once the questions start', () => {
    const atQuestions = { ...initialWizard('FIRST_RUN', 'd1'), step: 'Q_CONTEXT' as const };
    expect(chooseDog(atQuestions, 'd2').assessedDogId).toBe('d1');
    expect(chooseDog({ ...atQuestions, step: 'DOG' }, 'd2').assessedDogId).toBe('d2');
  });

  it("prefills the age stage from the dog's birth date without overwriting an answer", () => {
    expect(prefillFor('2026-08-01', '2026-10-25')).toEqual({ ageStage: 'PUPPY_2_6M' });
    expect(prefillFor(null)).toEqual({});
    const answered = { ...initialWizard('FIRST_RUN', null), step: 'DOG' as const, answers: { ageStage: 'SENIOR_7Y_PLUS' as const } };
    expect(chooseDog(answered, 'd1', { ageStage: 'PUPPY_2_6M' }).answers.ageStage).toBe('SENIOR_7Y_PLUS');
  });

  it('returns to the dog step, unbound, when the dog is gone', () => {
    expect(resetToDogStep({ ...initialWizard('FIRST_RUN', 'd1'), step: 'RESULT' })).toMatchObject({ step: 'DOG', assessedDogId: null });
  });
});

describe('answers', () => {
  it('patches each kind with validation, ignoring invalid values', () => {
    expect(patchAnswer({}, 'livingEnv', 'RURAL_OPEN')).toEqual({ livingEnv: 'RURAL_OPEN' });
    expect(patchAnswer({}, 'livingEnv', 'toString')).toEqual({});
    expect(patchAnswer({}, 'foodDrive', '4')).toEqual({ foodDrive: 4 });
    expect(patchAnswer({}, 'foodDrive', '9')).toEqual({});
    expect(patchAnswer({}, 'primaryGoals', ['WORKING_OBEDIENCE', 'FLY'])).toEqual({ primaryGoals: ['WORKING_OBEDIENCE'] });
    expect(patchAnswer({}, 'ageStage', ['ADULT_1_7Y'])).toEqual({});
  });

  it('shows answers as chip values', () => {
    expect(chipValue({ energyLevel: 5 }, 'energyLevel')).toBe('5');
    expect(chipValue({ primaryGoals: ['CONFIDENCE_BUILDING'] }, 'primaryGoals')).toEqual(['CONFIDENCE_BUILDING']);
    expect(chipValue({}, 'livingEnv')).toBeNull();
  });

  it('completes only a full, valid answer set', () => {
    expect(completeAnswers(makeAnswers())).toEqual(makeAnswers());
    const { energyLevel: _omitted, ...partial } = makeAnswers();
    expect(completeAnswers(partial)).toBeNull();
  });
});

describe('onboardingRoute', () => {
  it.each([
    ['loading', { isLoading: true, isError: false, data: undefined }, 'LOADING'],
    ['a failed query (fails open)', { isLoading: false, isError: true, data: undefined }, 'APP'],
    ['no profile row (fails open)', { isLoading: false, isError: false, data: null }, 'APP'],
    ['not yet onboarded', { isLoading: false, isError: false, data: { onboarding_completed: false } }, 'ONBOARDING'],
    ['onboarded', { isLoading: false, isError: false, data: { onboarding_completed: true } }, 'APP'],
  ] as const)('%s → %s', (_label, query, route) => {
    expect(onboardingRoute(query)).toBe(route);
  });
});
