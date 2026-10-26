import { AGE_STAGE_MIN_MONTHS } from '../data/assessmentQuestions';
import type { AgeStage, ArousalLevel, AssessmentAnswers, DogSignals, NerveProfile, PrimaryMotivator, TemperamentTrait } from '../types';

// Turns what the owner told us into the signals the engine reads. A full assessment gives every signal;
// the legacy one-tap trait gives a coarse version, so dogs assessed before the questionnaire still work.

/** The age stage that covers a known age. */
export function ageStageFor(months: number): AgeStage {
  if (months < 6) return 'PUPPY_2_6M';
  if (months < 18) return 'ADOLESCENT_6_18M';
  if (months < 84) return 'ADULT_1_7Y';
  return 'SENIOR_7Y_PLUS';
}

/** Food vs. play: a gap of 2 or more names the stronger one; otherwise both work. */
function motivatorOf(answers: AssessmentAnswers): PrimaryMotivator {
  const gap = answers.foodDrive - answers.playPreyDrive;
  if (gap >= 2) return 'HIGH_VALUE_FOOD';
  if (gap <= -2) return 'TUG_AND_PREY_TOY';
  return 'HYBRID_REWARD';
}

function nerveOf(answers: AssessmentAnswers): NerveProfile {
  if (answers.startleRecovery === 'FEARFUL_SLOW_RECOVERY' || answers.correctionSensitivity === 'SHUTS_DOWN_APPEASES' || answers.reactivityType === 'SHY_AVOIDANT') {
    return 'SENSITIVE_SOFT';
  }
  if (answers.startleRecovery === 'CONFIDENT_INVESTIGATES' && answers.correctionSensitivity === 'IGNORES_PUSHES_THROUGH' && answers.energyLevel >= 4) return 'HARD_HIGH_DRIVE';
  return 'BALANCED_STABLE';
}

function arousalOf(answers: AssessmentAnswers): ArousalLevel {
  const explodes = answers.reactivityType === 'REACTIVE_LUNGING_BARKING' || answers.outdoorFocus === 'DISCONNECTED_TUNNEL_VISION';
  if (explodes && answers.playPreyDrive >= 4) return 'HIGH';
  if (explodes || answers.reactivityType === 'FRUSTRATED_EXCITED_PULLER' || answers.outdoorFocus === 'DISTRACTED_BY_SCENTS' || answers.energyLevel >= 4) return 'MODERATE';
  return 'LOW';
}

/** Signals from a full assessment. A known birth-date age wins over the stage the owner picked. */
export function signalsFromAnswers(answers: AssessmentAnswers, birthAgeMonths: number | null): DogSignals {
  return {
    ageMonths: birthAgeMonths ?? AGE_STAGE_MIN_MONTHS[answers.ageStage],
    nerve: nerveOf(answers),
    arousal: arousalOf(answers),
    motivator: motivatorOf(answers),
    fearful: answers.startleRecovery === 'FEARFUL_SLOW_RECOVERY',
    reactiveLunging: answers.reactivityType === 'REACTIVE_LUNGING_BARKING',
    handler: answers.handlerExperience,
    correction: answers.correctionSensitivity,
    reliabilityGoal: answers.primaryGoals.includes('RELIABLE_OFF_LEASH_RECALL') || answers.primaryGoals.includes('WORKING_OBEDIENCE'),
    answers,
  };
}

/** Signals when nothing about temperament is known: only the age gates apply. */
export function signalsFromAgeOnly(ageMonths: number | null): DogSignals {
  return { ageMonths, nerve: 'BALANCED_STABLE', arousal: 'LOW', motivator: null, fearful: false, reactiveLunging: false, handler: null, correction: null, reliabilityGoal: false, answers: null };
}

/** Signals from the legacy one-tap trait (a dog not assessed yet). */
export function signalsFromTrait(trait: TemperamentTrait, ageMonths: number | null): DogSignals {
  const base = signalsFromAgeOnly(ageMonths);
  if (trait === 'ANXIOUS_SENSITIVE') return { ...base, nerve: 'SENSITIVE_SOFT', fearful: true };
  if (trait === 'HIGH_AROUSAL_PREY') return { ...base, arousal: 'HIGH', correction: 'IGNORES_PUSHES_THROUGH' };
  return base;
}

/** The closest legacy trait, saved alongside an assessment so older app versions behave sensibly. */
export function traitForSignals(signals: DogSignals): TemperamentTrait {
  if (signals.nerve === 'SENSITIVE_SOFT') return 'ANXIOUS_SENSITIVE';
  return signals.arousal === 'HIGH' ? 'HIGH_AROUSAL_PREY' : 'STEADY';
}
