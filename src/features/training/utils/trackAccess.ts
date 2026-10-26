import type { BalancedAccess, TrainingPreferences } from '@/features/gamification/types';
import { ageInMonths } from '@/utils/date';

import { RISK_WARNINGS } from '../data/assessmentCopy';
import { BALANCED_RULES_VERSION, TEMPERAMENT_LABELS_HE } from '../data/methodology';
import type { BalancedGate, RiskWarning, StoredAssessment, TemperamentTrait, TrainingRecommendation, TrainingTrack } from '../types';
import { signalsFromAgeOnly } from './assessmentProfile';
import { recommendFromAssessment, recommendFromSignals, recommendTraining } from './temperamentEngine';

// Who may see and record balanced-track content, decided from the dog as it is now: the age floor wins
// over any stored choice or consent, and consent counts only for the current version of what applies.

export interface BalancedConsent {
  rulesAckVersion: number | null;
  acknowledgedRisks: Readonly<Record<string, number>>;
}

/** Warnings the owner still has to confirm: CAUTION and HIGH ones not confirmed at their current version. */
export function pendingRisks(warnings: readonly RiskWarning[], acknowledged: Readonly<Record<string, number>>): RiskWarning[] {
  return warnings.filter((warning) => {
    if (warning.severity !== 'CAUTION' && warning.severity !== 'HIGH') return false;
    const confirmed = Object.prototype.hasOwnProperty.call(acknowledged, warning.id) ? acknowledged[warning.id] : undefined;
    return confirmed === undefined || confirmed < warning.version;
  });
}

/** Whether balanced content may render and be recorded now (LOCKED regardless of consent). */
export function balancedAccess(gate: BalancedGate, warnings: readonly RiskWarning[], consent: BalancedConsent): BalancedAccess {
  if (gate === 'LOCKED') return 'LOCKED';
  if (consent.rulesAckVersion !== BALANCED_RULES_VERSION) return 'NEEDS_RULES';
  return pendingRisks(warnings, consent.acknowledgedRisks).length > 0 ? 'NEEDS_RISKS' : 'GRANTED';
}

/** The track actually used: a stored balanced choice falls back to force-free while the dog is locked. */
export function effectiveTrack(stored: TrainingTrack, access: BalancedAccess): TrainingTrack {
  return access === 'LOCKED' ? 'FORCE_FREE' : stored;
}

/** Narrows the stored temperament string to a known trait. */
export const asTrait = (value: string | null): TemperamentTrait | null =>
  value !== null && Object.prototype.hasOwnProperty.call(TEMPERAMENT_LABELS_HE, value) ? (value as TemperamentTrait) : null;

export interface TrainingContext {
  /** null when neither an assessment nor the one-tap trait is known. */
  recommendation: TrainingRecommendation | null;
  trait: TemperamentTrait | null;
  assessment: StoredAssessment | null;
  gate: BalancedGate;
  warnings: readonly RiskWarning[];
  access: BalancedAccess;
  /** Warnings to confirm before balanced content opens. */
  pending: RiskWarning[];
  /** The owner's assessment choice, else the recommendation, else force-free. */
  defaultTrack: TrainingTrack;
  /** Why the balanced track is closed, when it is. */
  lockReasonHe: string | null;
}

/** Everything the commands tab needs about one dog's tracks, from the dog as it is today. */
export function trainingContextFor(input: { birthDate: string | null; breedId: string | null; preferences: TrainingPreferences; today?: string }): TrainingContext {
  const { preferences } = input;
  const ageMonths = input.birthDate ? ageInMonths(input.birthDate, input.today) : null;
  const trait = asTrait(preferences.temperament);
  const assessment = preferences.assessment;
  const recommendation = assessment
    ? recommendFromAssessment(assessment.answers, ageMonths, input.breedId)
    : trait
      ? recommendTraining({ trait, ageMonths, breedId: input.breedId })
      : null;
  // Without any profile the age gates still apply, so a puppy is never offered balanced content.
  const gating = recommendation ?? recommendFromSignals(signalsFromAgeOnly(ageMonths), input.breedId);
  const consent = { rulesAckVersion: preferences.balancedRulesAckVersion, acknowledgedRisks: preferences.acknowledgedRisks };
  const access = balancedAccess(gating.gate, gating.warnings, consent);
  return {
    recommendation,
    trait,
    assessment,
    gate: gating.gate,
    warnings: gating.warnings,
    access,
    pending: pendingRisks(gating.warnings, preferences.acknowledgedRisks),
    defaultTrack: assessment?.selectedTrack ?? recommendation?.track ?? 'FORCE_FREE',
    lockReasonHe: access === 'LOCKED' ? RISK_WARNINGS.PUPPY_FLOOR.textHe : null,
  };
}
