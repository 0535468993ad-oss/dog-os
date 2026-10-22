// The match engine: red flags for high-drive working breeds, the strict hypoallergenic filter, budget
// maths, and determinism.
import { BREEDS_CATALOG, findBreed } from '../data/breedsCatalog';
import type { BreedProfile, LifestyleProfile } from '../types';
import { budgetShortfall, formatILS, monthlyCost } from '../utils/costs';
import { DEAL_BREAKER_CAP, rankBreeds, scoreBreed } from '../utils/matchAlgorithm';

const NOVICE_APARTMENT: LifestyleProfile = {
  dwelling: 'APT_ELEVATOR',
  surroundings: 'URBAN_DENSE',
  aloneHoursPerDay: 6,
  vigorousMinutesPerDay: 45,
  experience: 'FIRST_TIME',
  household: { infantsOrToddlers: false, olderKids: false, catsOrSmallPets: false },
  allergy: 'NO_CONCERN',
  monthlyBudgetILS: 1000,
  goal: 'FAMILY_BUDDY',
};

const WORKING_HOME: LifestyleProfile = {
  ...NOVICE_APARTMENT,
  dwelling: 'HOUSE',
  surroundings: 'QUIET_RURAL',
  aloneHoursPerDay: 2,
  vigorousMinutesPerDay: 150,
  experience: 'WORKING_HANDLER',
  monthlyBudgetILS: 1500,
  goal: 'WORKING_DRIVE',
};

/** A catalog breed that must exist. */
function breed(id: string): BreedProfile {
  const found = findBreed(id);
  if (!found) throw new Error(`missing breed ${id}`);
  return found;
}

describe('high-drive working breeds', () => {
  it.each(['belgian-malinois', 'border-collie', 'australian-shepherd'])('%s is a severe mismatch for a novice in an apartment with 45 minutes a day', (id) => {
    const match = scoreBreed(NOVICE_APARTMENT, breed(id));
    expect(match.tier).toBe('HIGH_RISK_MISMATCH');
    expect(match.dealBreakersHe.length).toBeGreaterThanOrEqual(2);
    expect(match.matchPercentage).toBeLessThanOrEqual(DEAL_BREAKER_CAP);
    expect(match.dealBreakersHe.join(' ')).toMatch(/90 דקות/);
  });

  it('flags under 90 minutes of activity even for an experienced handler with a house', () => {
    const match = scoreBreed({ ...WORKING_HOME, vigorousMinutesPerDay: 75 }, breed('belgian-malinois'));
    expect(match.tier).toBe('HIGH_RISK_MISMATCH');
    expect(match.dealBreakersHe).toHaveLength(1);
  });

  it('rates the Malinois optimal for a working handler with a house and 2.5 hours a day', () => {
    const match = scoreBreed(WORKING_HOME, breed('belgian-malinois'));
    expect(match.tier).toBe('OPTIMAL');
    expect(match.dealBreakersHe).toEqual([]);
  });

  it('ranks forgiving family breeds above the working lines for the novice', () => {
    const { matches } = rankBreeds(NOVICE_APARTMENT, BREEDS_CATALOG);
    const position = (id: string) => matches.findIndex((match) => match.breed.id === id);
    expect(position('labrador')).toBeLessThan(position('belgian-malinois'));
    expect(position('cavalier')).toBeLessThan(position('border-collie'));
  });
});

describe('hypoallergenic filter', () => {
  const strict = rankBreeds({ ...NOVICE_APARTMENT, allergy: 'STRICT_HYPOALLERGENIC' }, BREEDS_CATALOG);

  it('keeps only low-shedding coats', () => {
    expect(strict.matches.length).toBeGreaterThan(0);
    expect(strict.matches.every((match) => match.breed.tolerances.hypoallergenic)).toBe(true);
    expect(strict.matches.some((match) => match.breed.metrics.sheddingLevel >= 3)).toBe(false);
  });

  it('removes every heavy shedder and counts what it removed', () => {
    const ids = strict.matches.map((match) => match.breed.id);
    for (const shedder of ['german-shepherd', 'golden-retriever', 'labrador', 'border-collie', 'pomeranian']) expect(ids).not.toContain(shedder);
    expect(strict.excludedCount).toBe(BREEDS_CATALOG.length - strict.matches.length);
  });

  it('only penalises heavy shedding when low shedding is a preference', () => {
    const preferred = scoreBreed({ ...NOVICE_APARTMENT, allergy: 'PREFER_LOW_SHEDDING' }, breed('golden-retriever'));
    expect(preferred.excluded).toBe(false);
    expect(preferred.matchPercentage).toBeLessThan(scoreBreed(NOVICE_APARTMENT, breed('golden-retriever')).matchPercentage);
  });
});

describe('budget', () => {
  it('sums food, insurance with preventive care, and grooming', () => {
    expect(monthlyCost(breed('german-shepherd'))).toEqual({ foodILS: 400, insuranceAndVetILS: 280, groomingILS: 60, totalILS: 740 });
  });

  it('measures the shortfall as a share of the upkeep', () => {
    const cost = monthlyCost(breed('german-shepherd'));
    expect(budgetShortfall(1000, cost)).toBe(0);
    expect(budgetShortfall(555, cost)).toBeCloseTo(0.25);
  });

  it('turns a budget a quarter below the upkeep into a red flag with the real figure', () => {
    const match = scoreBreed({ ...NOVICE_APARTMENT, monthlyBudgetILS: 400 }, breed('french-bulldog'));
    expect(match.monthlyCost.totalILS).toBe(580);
    expect(match.tier).toBe('HIGH_RISK_MISMATCH');
    expect(match.dealBreakersHe.join(' ')).toContain('580 ₪');
  });

  it('formats shekels with a thousands separator', () => {
    expect(formatILS(1250)).toBe('1,250 ₪');
    expect(formatILS(700)).toBe('700 ₪');
  });
});

describe('household and goal red flags', () => {
  it('flags a sighthound mix in a home with cats', () => {
    const match = scoreBreed({ ...NOVICE_APARTMENT, household: { infantsOrToddlers: false, olderKids: false, catsOrSmallPets: true } }, breed('saluki-mix'));
    expect(match.dealBreakersHe.join(' ')).toMatch(/דחף טרף/);
  });

  it('refuses a brachycephalic dog as a running partner', () => {
    const match = scoreBreed({ ...NOVICE_APARTMENT, goal: 'ATHLETE' }, breed('french-bulldog'));
    expect(match.tier).toBe('HIGH_RISK_MISMATCH');
  });

  it('flags a toddler home for a breed with the lowest kid compatibility', () => {
    const match = scoreBreed({ ...NOVICE_APARTMENT, household: { infantsOrToddlers: true, olderKids: false, catsOrSmallPets: false } }, breed('chihuahua'));
    expect(match.dealBreakersHe.length).toBeGreaterThan(0);
  });
});

describe('ranking', () => {
  it('is deterministic and sorted best first, with scores in 0–100', () => {
    const first = rankBreeds(NOVICE_APARTMENT, BREEDS_CATALOG).matches.map((match) => [match.breed.id, match.matchPercentage]);
    const second = rankBreeds(NOVICE_APARTMENT, BREEDS_CATALOG).matches.map((match) => [match.breed.id, match.matchPercentage]);
    expect(first).toEqual(second);
    const scores = first.map(([, score]) => Number(score));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(scores.every((score) => score >= 0 && score <= 100)).toBe(true);
  });
});
