import type { BreedProfile } from './breed';

export type Dwelling = 'APT_NO_ELEVATOR' | 'APT_ELEVATOR' | 'GARDEN_APT' | 'HOUSE';
export type Surroundings = 'URBAN_DENSE' | 'QUIET_RURAL';
export type Experience = 'FIRST_TIME' | 'EXPERIENCED' | 'WORKING_HANDLER';
export type AllergyNeed = 'STRICT_HYPOALLERGENIC' | 'PREFER_LOW_SHEDDING' | 'NO_CONCERN';
export type PrimaryGoal = 'COUCH_COMPANION' | 'FAMILY_BUDDY' | 'ATHLETE' | 'WORKING_DRIVE';

/** The six answered dimensions of the lifestyle profiler. */
export interface LifestyleProfile {
  dwelling: Dwelling;
  surroundings: Surroundings;
  aloneHoursPerDay: number;
  /** Real exercise the household commits to every day (not short potty breaks). */
  vigorousMinutesPerDay: number;
  experience: Experience;
  household: { infantsOrToddlers: boolean; olderKids: boolean; catsOrSmallPets: boolean };
  allergy: AllergyNeed;
  monthlyBudgetILS: number;
  goal: PrimaryGoal;
}

export type MatchTier = 'OPTIMAL' | 'GOOD_WITH_ADJUSTMENTS' | 'HIGH_RISK_MISMATCH';

/** What one rule found: points off the score, a soft caution, or a hard red flag. */
export interface RuleFinding {
  penalty: number;
  cautionHe?: string;
  dealBreakerHe?: string;
  /** Strict filters (e.g. a hypoallergenic need) remove the breed from the results altogether. */
  exclude?: boolean;
}

export interface MonthlyCost {
  foodILS: number;
  insuranceAndVetILS: number;
  groomingILS: number;
  totalILS: number;
}

export interface BreedMatch {
  breed: BreedProfile;
  matchPercentage: number;
  tier: MatchTier;
  dealBreakersHe: string[];
  cautionsHe: string[];
  excluded: boolean;
  monthlyCost: MonthlyCost;
}
