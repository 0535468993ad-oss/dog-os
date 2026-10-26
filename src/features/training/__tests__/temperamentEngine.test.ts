// The calibrated engine: one hard lock (under 6 months), targeted warnings for everything else, and a
// recommendation fitted to this dog. The legacy one-tap trait runs through the same state machine.
import { makeAnswers } from '@/test/fixtures';

import { RISK_WARNINGS } from '../data/assessmentCopy';
import type { AssessmentAnswers, TrainingRecommendation } from '../types';
import { signalsFromAgeOnly } from '../utils/assessmentProfile';
import { breedNoteFor, gateFor, recommendFromAssessment, recommendFromSignals, recommendTraining } from '../utils/temperamentEngine';

const JACKSON = { ageMonths: 36, breedId: 'german-shepherd' };
const ids = (rec: TrainingRecommendation) => rec.warnings.map((warning) => warning.id);
const assess = (overrides: Partial<AssessmentAnswers> = {}, ageMonths: number | null = 36) => recommendFromAssessment(makeAnswers(overrides), ageMonths, null);

describe('the balanced-track gate', () => {
  it.each([
    [3, 'LOCKED'],
    [5, 'LOCKED'],
    [6, 'PROFESSIONAL_ADVISED'],
    [11, 'PROFESSIONAL_ADVISED'],
    [12, 'OPEN'],
    [96, 'OPEN'],
  ] as const)('a stable dog of %i months → %s', (age, gate) => {
    expect(assess({}, age).gate).toBe(gate);
  });

  it('an unknown age adds an info note, never a lock', () => {
    const rec = recommendTraining({ trait: 'STEADY', ageMonths: null, breedId: null });
    expect(ids(rec)).toEqual(['UNKNOWN_AGE']);
    expect(rec.gate).toBe('OPEN');
  });

  it('advises against (but does not lock) the balanced track for a sensitive dog', () => {
    for (const overrides of [{ startleRecovery: 'FEARFUL_SLOW_RECOVERY' }, { correctionSensitivity: 'SHUTS_DOWN_APPEASES' }, { reactivityType: 'SHY_AVOIDANT' }] as const) {
      const rec = assess(overrides);
      expect(rec.gate).toBe('ADVISED_AGAINST');
      expect(ids(rec)).toContain('SENSITIVE_NERVE');
      expect(rec.track).toBe('FORCE_FREE');
    }
  });

  it('adds the vet-behaviourist referral for fear together with lunging', () => {
    const rec = assess({ startleRecovery: 'FEARFUL_SLOW_RECOVERY', reactivityType: 'REACTIVE_LUNGING_BARKING' });
    expect(ids(rec)).toEqual(expect.arrayContaining(['SENSITIVE_NERVE', 'FEAR_REACTIVE']));
    expect(rec.warnings.map((warning) => warning.textHe).join(' ')).toMatch(/וטרינר מומחה להתנהגות/);
  });

  it('calls for a professional for a first-time handler, an adolescent and high arousal', () => {
    expect(ids(assess({ handlerExperience: 'FIRST_TIME' }))).toContain('NOVICE_TIMING');
    expect(ids(assess({}, 8))).toContain('ADOLESCENT');
    const aroused = assess({ reactivityType: 'REACTIVE_LUNGING_BARKING', playPreyDrive: 5 });
    expect(ids(aroused)).toContain('HIGH_AROUSAL');
    expect(aroused.gate).toBe('PROFESSIONAL_ADVISED');
  });

  it('takes the most restrictive warning: the floor wins over everything, and comes first', () => {
    const rec = assess({ startleRecovery: 'FEARFUL_SLOW_RECOVERY', handlerExperience: 'FIRST_TIME' }, 3);
    expect(rec.gate).toBe('LOCKED');
    expect(ids(rec)[0]).toBe('PUPPY_FLOOR');
    expect(gateFor([])).toBe('OPEN');
    expect(gateFor([RISK_WARNINGS.UNKNOWN_AGE, RISK_WARNINGS.NOVICE_TIMING])).toBe('PROFESSIONAL_ADVISED');
  });

  it('applies the age gates even when nothing about temperament is known', () => {
    expect(recommendFromSignals(signalsFromAgeOnly(4), null).gate).toBe('LOCKED');
    expect(recommendFromSignals(signalsFromAgeOnly(40), null).gate).toBe('OPEN');
  });

  it('lets a known birth-date age win over the picked age stage', () => {
    expect(recommendFromAssessment(makeAnswers({ ageStage: 'ADULT_1_7Y' }), 4, null).gate).toBe('LOCKED');
    // Without a birth date the stage's lower bound counts: an adolescent stage means at least 6 months.
    expect(recommendFromAssessment(makeAnswers({ ageStage: 'ADOLESCENT_6_18M' }), null, null).gate).toBe('PROFESSIONAL_ADVISED');
  });
});

describe('the recommendation', () => {
  it('recommends balanced for an adult that pushes through corrections, on an R+ foundation', () => {
    const rec = assess({ correctionSensitivity: 'IGNORES_PUSHES_THROUGH' });
    expect(rec).toMatchObject({ track: 'BALANCED', gate: 'OPEN', requiresProfessional: false });
    const reasons = rec.reasonsHe.join(' ');
    expect(reasons).toMatch(/גבולות ברורים ועקביים/);
    expect(reasons).toMatch(/הבסיס נשאר חיזוק חיובי/);
    expect(reasons).toMatch(/איגודי ההתנהגות הווטרינריים/);
  });

  it('recommends balanced for a reliability goal with an experienced handler, not for a first-timer', () => {
    expect(assess({ primaryGoals: ['RELIABLE_OFF_LEASH_RECALL'] }).track).toBe('BALANCED');
    expect(assess({ primaryGoals: ['WORKING_OBEDIENCE'], handlerExperience: 'FIRST_TIME' }).track).toBe('FORCE_FREE');
  });

  it('recommends balanced for high arousal, with a professional', () => {
    expect(assess({ reactivityType: 'REACTIVE_LUNGING_BARKING', playPreyDrive: 5 })).toMatchObject({ track: 'BALANCED', requiresProfessional: true });
  });

  it('keeps force-free under 12 months, for a dog that shuts down, and for a stable dog with no reliability goal', () => {
    expect(assess({ correctionSensitivity: 'IGNORES_PUSHES_THROUGH' }, 11).track).toBe('FORCE_FREE');
    expect(assess({ correctionSensitivity: 'SHUTS_DOWN_APPEASES' }).track).toBe('FORCE_FREE');
    expect(assess()).toMatchObject({ track: 'FORCE_FREE', gate: 'OPEN', requiresProfessional: false });
  });

  it('asks a first-time handler on the balanced track to work with a professional', () => {
    expect(assess({ correctionSensitivity: 'IGNORES_PUSHES_THROUGH', handlerExperience: 'FIRST_TIME' })).toMatchObject({ track: 'BALANCED', requiresProfessional: true });
  });

  it('tailors up to four tips to the answers', () => {
    const rec = assess({ playPreyDrive: 5, correctionSensitivity: 'IGNORES_PUSHES_THROUGH', energyLevel: 5, outdoorFocus: 'DISCONNECTED_TUNNEL_VISION', livingEnv: 'BUSY_CITY_APT' });
    expect(rec.adjustmentsHe.length).toBe(4);
    expect(rec.adjustmentsHe.join(' ')).toMatch(/Tug/);
    expect(rec.adjustmentsHe.join(' ')).toMatch(/בהירות לפני הכול/);
    expect(assess({ foodDrive: 5, playPreyDrive: 1 }).adjustmentsHe.join(' ')).toMatch(/חטיפים בעלי ערך גבוה/);
  });

  it('describes motivator and nerve profile', () => {
    expect(assess({ foodDrive: 5, playPreyDrive: 2 }).motivator).toBe('HIGH_VALUE_FOOD');
    expect(assess({ startleRecovery: 'CONFIDENT_INVESTIGATES', correctionSensitivity: 'IGNORES_PUSHES_THROUGH', energyLevel: 5 }).nerve).toBe('HARD_HIGH_DRIVE');
  });

  it('never uses dominance language or claims one method is more effective', () => {
    const variants: Partial<AssessmentAnswers>[] = [
      {},
      { correctionSensitivity: 'IGNORES_PUSHES_THROUGH' },
      { startleRecovery: 'FEARFUL_SLOW_RECOVERY', reactivityType: 'REACTIVE_LUNGING_BARKING' },
      { reactivityType: 'REACTIVE_LUNGING_BARKING', playPreyDrive: 5, handlerExperience: 'FIRST_TIME' },
      { primaryGoals: ['WORKING_OBEDIENCE'] },
    ];
    const texts = variants.flatMap((overrides) => [3, 8, 36].flatMap((age) => {
      const rec = assess(overrides, age);
      return [rec.titleHe, ...rec.reasonsHe, ...rec.principlesHe, ...rec.adjustmentsHe, ...rec.warnings.map((warning) => warning.textHe)];
    }));
    expect(texts.filter((text) => /דומיננט|אלפא|יעיל יותר|הכי יעיל|עדיף מדעית/.test(text))).toEqual([]);
  });
});

describe('the legacy one-tap trait', () => {
  it('keeps an anxious adult on R+ with quiet structure, advised against balanced (no longer locked)', () => {
    const rec = recommendTraining({ ...JACKSON, trait: 'ANXIOUS_SENSITIVE' });
    expect(rec).toMatchObject({ track: 'FORCE_FREE', gate: 'ADVISED_AGAINST' });
    const principles = rec.principlesHe.join(' ');
    expect(principles).toMatch(/Spatial Pressure/);
    expect(principles).toMatch(/גבולות יציבים/);
    expect(principles).toMatch(/בלי טלטול רצועה/);
  });

  it('recommends balanced for Jackson with high arousal, with a professional and the breed note', () => {
    const rec = recommendTraining({ ...JACKSON, trait: 'HIGH_AROUSAL_PREY' });
    expect(rec).toMatchObject({ track: 'BALANCED', gate: 'PROFESSIONAL_ADVISED', requiresProfessional: true });
    expect(rec.reasonsHe.join(' ')).toMatch(/דחף עבודה גבוה – דורש פריקת אנרגיה מוחית/);
  });

  it('keeps a high-arousal 8-month-old force-free, gated for a professional, with self-control games', () => {
    const rec = recommendTraining({ trait: 'HIGH_AROUSAL_PREY', ageMonths: 8, breedId: 'belgian-malinois' });
    expect(rec).toMatchObject({ track: 'FORCE_FREE', gate: 'PROFESSIONAL_ADVISED' });
    expect(ids(rec)).toEqual(expect.arrayContaining(['ADOLESCENT', 'HIGH_AROUSAL']));
    expect(rec.principlesHe.join(' ')).toMatch(/שליטה עצמית/);
  });

  it('locks every trait under 6 months', () => {
    for (const trait of ['ANXIOUS_SENSITIVE', 'STEADY', 'HIGH_AROUSAL_PREY'] as const) expect(recommendTraining({ trait, ageMonths: 3, breedId: null }).gate).toBe('LOCKED');
  });

  it('defaults a steady adult to R+ with both tracks open', () => {
    expect(recommendTraining({ ...JACKSON, trait: 'STEADY' })).toMatchObject({ track: 'FORCE_FREE', gate: 'OPEN', requiresProfessional: false });
  });

  it('treats an unknown age as adult, with a note asking for the birth date', () => {
    const rec = recommendTraining({ trait: 'HIGH_AROUSAL_PREY', ageMonths: null, breedId: null });
    expect(rec.track).toBe('BALANCED');
    expect(ids(rec)).toContain('UNKNOWN_AGE');
    expect(recommendTraining({ trait: 'ANXIOUS_SENSITIVE', ageMonths: null, breedId: null }).gate).toBe('ADVISED_AGAINST');
  });
});

describe('breedNoteFor', () => {
  it('notes working breeds only, and the recommendation carries the same note', () => {
    const note = breedNoteFor('german-shepherd');
    expect(note).toBe('דחף עבודה גבוה – דורש פריקת אנרגיה מוחית לפני תרגול משמעת.');
    expect(breedNoteFor('rottweiler')).toMatch(/^גזע עבודה:/);
    expect(breedNoteFor('beagle')).toBeNull();
    expect(breedNoteFor(null)).toBeNull();
    expect(recommendTraining({ ...JACKSON, trait: 'STEADY' }).reasonsHe).toContain(note);
  });
});
