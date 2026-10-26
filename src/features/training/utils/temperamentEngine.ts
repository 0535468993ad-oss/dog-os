import { findBreedProfile, isHighDriveWorkingBreed, WORK_DRIVE_FLAG_HE } from '@/features/breeds/utils/breedTraits';

import { ADJUSTMENTS_HE, BALANCED_PRINCIPLES_HE, R_PLUS_PRINCIPLES_HE, REASONS_HE, RISK_GATES, RISK_WARNINGS, SELF_CONTROL_PRINCIPLE_HE, TITLES_HE } from '../data/assessmentCopy';
import { QUIET_STRUCTURE_PRINCIPLES_HE } from '../data/methodology';
import type { AssessmentAnswers, BalancedGate, DogSignals, RiskId, RiskWarning, TemperamentInput, TrainingRecommendation, TrainingTrack } from '../types';
import { signalsFromAnswers, signalsFromTrait } from './assessmentProfile';

// The calibrated training-track engine. Each risk that applies to a dog adds a targeted warning, and the
// most restrictive one sets the balanced-track gate. Only the under-6-months floor locks the track;
// everything else is the owner's informed choice. The recommendation fits the track to this dog's
// profile – the owner can always pick the other one.

/** Below this age no aversive tool is used at all (the one hard lock). */
export const MIN_MONTHS_FOR_ANY_TOOLS = 6;
/** Below this age: no e-collar or prong, and the recommendation stays force-free. */
export const MIN_MONTHS_FOR_TOOLS = 12;
/** Working breeds whose drive often reads as "stubbornness" – a note, not a verdict. */
const WORKING_BREEDS = new Set(['german-shepherd', 'belgian-malinois', 'border-collie', 'australian-shepherd', 'doberman', 'rottweiler']);

const GATE_ORDER: readonly BalancedGate[] = ['LOCKED', 'ADVISED_AGAINST', 'PROFESSIONAL_ADVISED', 'OPEN'];
const gateRank = (gate: BalancedGate) => GATE_ORDER.indexOf(gate);

/**
 * The breed note for a dog: the work-drive flag when its breed profile shows a high-drive working breed
 * (breed genetics from the breeds feature), the general working-breed note otherwise, or null.
 */
export function breedNoteFor(breedId: string | null): string | null {
  const profile = findBreedProfile(breedId);
  if (profile && isHighDriveWorkingBreed(profile)) return WORK_DRIVE_FLAG_HE;
  return breedId && WORKING_BREEDS.has(breedId) ? 'גזע עבודה: הדחף הגבוה הוא מנוע – כשהוא מקבל תעסוקה מתאימה, הוא עובד בשבילכם.' : null;
}

/** Every targeted warning that applies to a dog, most restrictive first. */
export function warningsFor(signals: DogSignals): RiskWarning[] {
  const ids: RiskId[] = [];
  const age = signals.ageMonths;
  if (age === null) ids.push('UNKNOWN_AGE');
  else if (age < MIN_MONTHS_FOR_ANY_TOOLS) ids.push('PUPPY_FLOOR');
  else if (age < MIN_MONTHS_FOR_TOOLS) ids.push('ADOLESCENT');
  if (signals.nerve === 'SENSITIVE_SOFT') ids.push('SENSITIVE_NERVE');
  if (signals.fearful && signals.reactiveLunging) ids.push('FEAR_REACTIVE');
  if (signals.handler === 'FIRST_TIME') ids.push('NOVICE_TIMING');
  if (signals.arousal === 'HIGH') ids.push('HIGH_AROUSAL');
  return ids.map((id) => RISK_WARNINGS[id]).sort((a, b) => gateRank(RISK_GATES[a.id]) - gateRank(RISK_GATES[b.id]));
}

/** The most restrictive gate among the warnings; OPEN when none restricts. */
export function gateFor(warnings: readonly RiskWarning[]): BalancedGate {
  return warnings.reduce<BalancedGate>((gate, warning) => (gateRank(RISK_GATES[warning.id]) < gateRank(gate) ? RISK_GATES[warning.id] : gate), 'OPEN');
}

/** Whether the balanced track fits this dog best. An unknown age counts as adult (UNKNOWN_AGE asks for it). */
function balancedFits(signals: DogSignals, gate: BalancedGate): boolean {
  if (gate === 'LOCKED' || gate === 'ADVISED_AGAINST') return false;
  if (signals.ageMonths !== null && signals.ageMonths < MIN_MONTHS_FOR_TOOLS) return false;
  if (signals.correction === 'SHUTS_DOWN_APPEASES') return false;
  return signals.correction === 'IGNORES_PUSHES_THROUGH' || signals.arousal === 'HIGH' || (signals.reliabilityGoal && signals.handler !== 'FIRST_TIME');
}

const isYoung = (signals: DogSignals) => signals.ageMonths !== null && signals.ageMonths < MIN_MONTHS_FOR_TOOLS;

/** The reasons, in this dog's terms. */
function reasonsFor(signals: DogSignals, track: TrainingTrack, breedNote: string | null): string[] {
  const reasons: string[] = [];
  if (signals.ageMonths !== null && signals.ageMonths < MIN_MONTHS_FOR_ANY_TOOLS) reasons.push(REASONS_HE.puppy);
  else if (isYoung(signals)) reasons.push(REASONS_HE.young);
  if (signals.nerve === 'SENSITIVE_SOFT') reasons.push(REASONS_HE.sensitiveA, REASONS_HE.sensitiveB);
  if (track === 'BALANCED') {
    if (signals.arousal === 'HIGH') reasons.push(REASONS_HE.arousal);
    if (signals.correction === 'IGNORES_PUSHES_THROUGH' && signals.answers) reasons.push(REASONS_HE.pushesThrough);
    if (signals.reliabilityGoal) reasons.push(REASONS_HE.reliability);
    reasons.push(REASONS_HE.foundation, REASONS_HE.evidence);
  } else if (reasons.length === 0) {
    reasons.push(REASONS_HE.stable);
  }
  return breedNote ? [...reasons, breedNote] : reasons;
}

function principlesFor(signals: DogSignals, track: TrainingTrack): string[] {
  if (signals.nerve === 'SENSITIVE_SOFT') return [...QUIET_STRUCTURE_PRINCIPLES_HE];
  if (track === 'BALANCED') return [...BALANCED_PRINCIPLES_HE];
  return signals.arousal === 'HIGH' && isYoung(signals) ? [...R_PLUS_PRINCIPLES_HE, SELF_CONTROL_PRINCIPLE_HE] : [...R_PLUS_PRINCIPLES_HE];
}

/** Up to four tips for this dog: what to reward with, clarity, arousal and environment. */
function adjustmentsFor(signals: DogSignals): string[] {
  const tips: string[] = [];
  const quiet = QUIET_STRUCTURE_PRINCIPLES_HE[0];
  if (signals.nerve === 'SENSITIVE_SOFT' && quiet) tips.push(quiet);
  const answers = signals.answers;
  if (answers) {
    if (answers.playPreyDrive >= 4) tips.push(ADJUSTMENTS_HE.playReward);
    else if (answers.foodDrive >= 4) tips.push(ADJUSTMENTS_HE.foodReward);
    if (answers.correctionSensitivity === 'IGNORES_PUSHES_THROUGH') tips.push(ADJUSTMENTS_HE.clarity);
    if (answers.energyLevel >= 4) tips.push(ADJUSTMENTS_HE.energy);
    if (answers.outdoorFocus === 'DISCONNECTED_TUNNEL_VISION') tips.push(ADJUSTMENTS_HE.distance);
    if (answers.livingEnv === 'BUSY_CITY_APT') tips.push(ADJUSTMENTS_HE.city);
  }
  return tips.slice(0, 4);
}

function titleFor(signals: DogSignals, track: TrainingTrack, requiresProfessional: boolean): string {
  if (signals.nerve === 'SENSITIVE_SOFT') return TITLES_HE.sensitive;
  if (isYoung(signals)) return TITLES_HE.young;
  if (track === 'BALANCED') return requiresProfessional ? TITLES_HE.balanced : TITLES_HE.balancedExperienced;
  return TITLES_HE.forceFree;
}

/** The recommendation, gate and warnings for a dog's signals. */
export function recommendFromSignals(signals: DogSignals, breedId: string | null): TrainingRecommendation {
  const warnings = warningsFor(signals);
  const gate = gateFor(warnings);
  const track: TrainingTrack = balancedFits(signals, gate) ? 'BALANCED' : 'FORCE_FREE';
  const requiresProfessional = gate === 'PROFESSIONAL_ADVISED' || gate === 'ADVISED_AGAINST' || (track === 'BALANCED' && signals.handler === 'FIRST_TIME');
  return {
    track,
    titleHe: titleFor(signals, track, requiresProfessional),
    reasonsHe: reasonsFor(signals, track, breedNoteFor(breedId)),
    principlesHe: principlesFor(signals, track),
    gate,
    warnings,
    requiresProfessional,
    nerve: signals.nerve,
    motivator: signals.motivator,
    adjustmentsHe: adjustmentsFor(signals),
  };
}

/** The recommendation from the legacy one-tap trait (a dog not assessed yet). */
export function recommendTraining({ trait, ageMonths, breedId }: TemperamentInput): TrainingRecommendation {
  return recommendFromSignals(signalsFromTrait(trait, ageMonths), breedId);
}

/** The recommendation from a full assessment; a known birth-date age wins over the picked stage. */
export function recommendFromAssessment(answers: AssessmentAnswers, birthAgeMonths: number | null, breedId: string | null): TrainingRecommendation {
  return recommendFromSignals(signalsFromAnswers(answers, birthAgeMonths), breedId);
}
