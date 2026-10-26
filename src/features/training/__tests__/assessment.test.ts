// Stored assessments are validated field by field (own-property enum checks), and answers map onto the
// signals the engine reads.
import { makeAnswers } from '@/test/fixtures';

import { parseAnswers, parseStoredAssessment } from '../utils/assessmentParse';
import { ageStageFor, signalsFromAnswers, signalsFromTrait, traitForSignals } from '../utils/assessmentProfile';

describe('parseAnswers', () => {
  it('accepts a complete answer set', () => {
    expect(parseAnswers(makeAnswers())).toEqual(makeAnswers());
  });

  it.each([
    ['a prototype key as an enum', { ageStage: 'toString' }],
    ['"__proto__" as an enum', { livingEnv: '__proto__' }],
    ['an unknown enum', { reactivityType: 'BITES' }],
    ['a drive of 0', { foodDrive: 0 }],
    ['a drive of 6', { playPreyDrive: 6 }],
    ['a fractional drive', { energyLevel: 2.5 }],
    ['a drive as a string', { foodDrive: '3' }],
    ['no goals', { primaryGoals: [] }],
    ['an invalid goal among valid ones', { primaryGoals: ['STOP_LEASH_PULLING', 'FLY'] }],
    ['goals that are not an array', { primaryGoals: 'STOP_LEASH_PULLING' }],
  ])('rejects %s', (_label, overrides) => {
    expect(parseAnswers({ ...makeAnswers(), ...overrides })).toBeNull();
  });

  it('rejects a missing answer, and non-objects', () => {
    const { outdoorFocus: _omitted, ...partial } = makeAnswers();
    expect(parseAnswers(partial)).toBeNull();
    expect(parseAnswers(null)).toBeNull();
    expect(parseAnswers([makeAnswers()])).toBeNull();
  });

  it('de-duplicates goals', () => {
    expect(parseAnswers(makeAnswers({ primaryGoals: ['STOP_LEASH_PULLING', 'STOP_LEASH_PULLING'] }))?.primaryGoals).toEqual(['STOP_LEASH_PULLING']);
  });
});

describe('parseStoredAssessment', () => {
  const stored = { answers: makeAnswers(), completedAt: '2026-10-25T09:00:00.000Z', selectedTrack: 'BALANCED', ownerOverrodeTrack: true };

  it('accepts a valid stored assessment', () => {
    expect(parseStoredAssessment(stored)).toEqual(stored);
  });

  it.each([
    ['an invalid date', { completedAt: 'yesterday' }],
    ['an unknown track', { selectedTrack: 'SHOCK' }],
    ['a non-boolean override flag', { ownerOverrodeTrack: 'yes' }],
    ['invalid answers', { answers: { ...makeAnswers(), ageStage: 'NEWBORN' } }],
  ])('returns null for %s', (_label, overrides) => {
    expect(parseStoredAssessment({ ...stored, ...overrides })).toBeNull();
  });

  it('never throws on junk', () => {
    expect(parseStoredAssessment(undefined)).toBeNull();
    expect(parseStoredAssessment('assessment')).toBeNull();
    expect(parseStoredAssessment([stored])).toBeNull();
  });
});

describe('assessment signals', () => {
  it.each([
    [5, 'PUPPY_2_6M'],
    [6, 'ADOLESCENT_6_18M'],
    [17, 'ADOLESCENT_6_18M'],
    [18, 'ADULT_1_7Y'],
    [83, 'ADULT_1_7Y'],
    [84, 'SENIOR_7Y_PLUS'],
  ] as const)('%i months is %s', (months, stage) => {
    expect(ageStageFor(months)).toBe(stage);
  });

  it('names the motivator from a gap of two or more', () => {
    expect(signalsFromAnswers(makeAnswers({ foodDrive: 5, playPreyDrive: 2 }), 30).motivator).toBe('HIGH_VALUE_FOOD');
    expect(signalsFromAnswers(makeAnswers({ foodDrive: 1, playPreyDrive: 4 }), 30).motivator).toBe('TUG_AND_PREY_TOY');
    expect(signalsFromAnswers(makeAnswers({ foodDrive: 3, playPreyDrive: 4 }), 30).motivator).toBe('HYBRID_REWARD');
  });

  it('reads the nerve profile', () => {
    expect(signalsFromAnswers(makeAnswers({ reactivityType: 'SHY_AVOIDANT' }), 30).nerve).toBe('SENSITIVE_SOFT');
    const confident = { startleRecovery: 'CONFIDENT_INVESTIGATES', correctionSensitivity: 'IGNORES_PUSHES_THROUGH' } as const;
    expect(signalsFromAnswers(makeAnswers({ ...confident, energyLevel: 4 }), 30).nerve).toBe('HARD_HIGH_DRIVE');
    expect(signalsFromAnswers(makeAnswers({ ...confident, energyLevel: 3 }), 30).nerve).toBe('BALANCED_STABLE');
  });

  it('reads arousal: an explosive dog with strong prey drive is high', () => {
    expect(signalsFromAnswers(makeAnswers({ outdoorFocus: 'DISCONNECTED_TUNNEL_VISION', playPreyDrive: 4 }), 30).arousal).toBe('HIGH');
    expect(signalsFromAnswers(makeAnswers({ outdoorFocus: 'DISCONNECTED_TUNNEL_VISION', playPreyDrive: 3 }), 30).arousal).toBe('MODERATE');
    expect(signalsFromAnswers(makeAnswers({ reactivityType: 'FRUSTRATED_EXCITED_PULLER' }), 30).arousal).toBe('MODERATE');
    expect(signalsFromAnswers(makeAnswers(), 30).arousal).toBe('LOW');
  });

  it("uses the birth-date age, else the stage's lower bound", () => {
    expect(signalsFromAnswers(makeAnswers(), 30).ageMonths).toBe(30);
    expect(signalsFromAnswers(makeAnswers({ ageStage: 'ADULT_1_7Y' }), null).ageMonths).toBe(18);
  });

  it('maps signals to the closest legacy trait, and the legacy trait to signals', () => {
    expect(traitForSignals(signalsFromAnswers(makeAnswers({ startleRecovery: 'FEARFUL_SLOW_RECOVERY' }), 30))).toBe('ANXIOUS_SENSITIVE');
    expect(traitForSignals(signalsFromAnswers(makeAnswers({ reactivityType: 'REACTIVE_LUNGING_BARKING', playPreyDrive: 5 }), 30))).toBe('HIGH_AROUSAL_PREY');
    expect(traitForSignals(signalsFromAnswers(makeAnswers(), 30))).toBe('STEADY');
    expect(signalsFromTrait('ANXIOUS_SENSITIVE', 30)).toMatchObject({ nerve: 'SENSITIVE_SOFT', fearful: true, answers: null });
  });
});
