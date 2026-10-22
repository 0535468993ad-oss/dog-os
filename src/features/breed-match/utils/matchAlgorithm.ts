import type { BreedMatch, BreedProfile, LifestyleProfile, MatchTier, RuleFinding } from '../types';
import { monthlyCost } from './costs';
import { aloneRule, budgetRule, coatRule, dwellingRule, exerciseRule, experienceRule, goalRule, householdRule } from './matchRules';

/** A breed with any deal-breaker never shows above this, whatever else fits. */
export const DEAL_BREAKER_CAP = 39;
export const OPTIMAL_THRESHOLD = 75;
export const ADJUSTMENTS_THRESHOLD = 50;

/** The tier for a score and its red flags. */
export function tierFor(percentage: number, dealBreakers: number): MatchTier {
  if (dealBreakers > 0 || percentage < ADJUSTMENTS_THRESHOLD) return 'HIGH_RISK_MISMATCH';
  return percentage >= OPTIMAL_THRESHOLD ? 'OPTIMAL' : 'GOOD_WITH_ADJUSTMENTS';
}

/** Scores one breed against the lifestyle: deterministic, 0–100, with its red flags and cautions. */
export function scoreBreed(profile: LifestyleProfile, breed: BreedProfile): BreedMatch {
  const cost = monthlyCost(breed);
  const findings: RuleFinding[] = [
    ...dwellingRule(profile, breed),
    ...exerciseRule(profile, breed),
    ...aloneRule(profile, breed),
    ...experienceRule(profile, breed),
    ...householdRule(profile, breed),
    ...coatRule(profile, breed),
    ...budgetRule(profile, cost),
    ...goalRule(profile, breed),
  ];
  const excluded = findings.some((finding) => finding.exclude);
  const dealBreakersHe = findings.flatMap((finding) => (finding.dealBreakerHe ? [finding.dealBreakerHe] : []));
  const cautionsHe = findings.flatMap((finding) => (finding.cautionHe ? [finding.cautionHe] : []));
  const penalty = findings.reduce((sum, finding) => sum + finding.penalty, 0);
  const raw = Math.max(0, Math.min(100, 100 - penalty));
  const matchPercentage = excluded ? 0 : dealBreakersHe.length > 0 ? Math.min(raw, DEAL_BREAKER_CAP) : raw;

  return { breed, matchPercentage, tier: tierFor(matchPercentage, dealBreakersHe.length), dealBreakersHe, cautionsHe, excluded, monthlyCost: cost };
}

/** Every breed ranked best first; excluded breeds are dropped and counted separately. */
export function rankBreeds(profile: LifestyleProfile, catalog: readonly BreedProfile[]): { matches: BreedMatch[]; excludedCount: number } {
  const scored = catalog.map((breed) => scoreBreed(profile, breed));
  const matches = scored
    .filter((match) => !match.excluded)
    .sort((a, b) => b.matchPercentage - a.matchPercentage || a.breed.nameHe.localeCompare(b.breed.nameHe, 'he'));
  return { matches, excludedCount: scored.length - matches.length };
}
