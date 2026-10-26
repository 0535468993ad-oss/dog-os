import { BREED_PROFILES } from '../data/breedsSeedData';
import type { BreedProfile, ExperienceLevel, LivingSuitability, Scale5, SizeCategory } from '../types';
import { boundedLevenshtein, normalizeText } from '../utils/textNormalize';

// Breed search: Hebrew, English, original names, abbreviations and transliterations, with typo
// tolerance, then facet filters and a sort. Pure, so it runs on every keystroke without a network.

export interface BreedFilters {
  living?: LivingSuitability;
  experience?: ExperienceLevel;
  sizes?: readonly SizeCategory[];
  /** Shedding at or below this level. */
  maxShedding?: Scale5;
  /** Low-shedding coats only. No dog is allergen-free – the allergen is in saliva and dander too. */
  nonShedding?: boolean;
  /** Only breeds with a known high predisposition to bloat (GDV). */
  gdvRisk?: boolean;
  /** Only brachycephalic breeds (any BOAS grade above none). */
  brachycephalic?: boolean;
}

export type BreedSort = 'RELEVANCE' | 'ENERGY' | 'POPULARITY' | 'LONGEVITY';

/** Every name a breed can be found by, normalised. */
const searchTerms = (profile: BreedProfile): string[] =>
  [profile.names.he, profile.names.en, profile.names.original, ...profile.aliases, ...profile.tags].map(normalizeText);

/** How well a breed matches a query: 100 exact, 80 prefix, 70 word prefix, 60 contains, 50 close typo, 0 none. */
export function scoreBreed(profile: BreedProfile, query: string): number {
  const q = normalizeText(query);
  if (q.length === 0) return 1;
  let best = 0;
  for (const term of searchTerms(profile)) {
    const words = term.split(' ');
    if (term === q) return 100;
    if (term.startsWith(q)) best = Math.max(best, 80);
    else if (words.some((word) => word.startsWith(q))) best = Math.max(best, 70);
    else if (term.includes(q)) best = Math.max(best, 60);
    else if (q.length >= 4) {
      const limit = q.length >= 7 ? 2 : 1;
      if ([term, ...words].some((candidate) => boundedLevenshtein(q, candidate, limit) <= limit)) best = Math.max(best, 50);
    }
  }
  return best;
}

/** Whether a breed passes every active filter. */
export function matchesFilters(profile: BreedProfile, filters: BreedFilters): boolean {
  if (filters.living && profile.suitability.living !== filters.living) return false;
  if (filters.experience && profile.suitability.experience !== filters.experience) return false;
  if (filters.sizes && filters.sizes.length > 0 && !filters.sizes.includes(profile.phenotype.sizeCategory)) return false;
  if (filters.maxShedding !== undefined && profile.phenotype.sheddingLevel > filters.maxShedding) return false;
  if (filters.nonShedding && profile.phenotype.coatType !== 'CURLY_NON_SHEDDING') return false;
  if (filters.gdvRisk && !profile.clinical.bloatGdvRisk.hasHighPredisposition) return false;
  const grade = profile.clinical.brachycephalicBoasGrade;
  if (filters.brachycephalic && (grade === undefined || grade === 'NONE')) return false;
  return true;
}

type Scored = { profile: BreedProfile; score: number };

const SORTS: Readonly<Record<Exclude<BreedSort, 'RELEVANCE'>, (a: BreedProfile, b: BreedProfile) => number>> = {
  ENERGY: (a, b) => b.drives.energyStaminaHoursDaily - a.drives.energyStaminaHoursDaily,
  // Breeds the AKC doesn't rank go last.
  POPULARITY: (a, b) => (a.popularity?.akcRank2024 ?? Number.MAX_SAFE_INTEGER) - (b.popularity?.akcRank2024 ?? Number.MAX_SAFE_INTEGER),
  LONGEVITY: (a, b) =>
    b.clinical.averageLongevityYears.max + b.clinical.averageLongevityYears.min - (a.clinical.averageLongevityYears.max + a.clinical.averageLongevityYears.min),
};

/** The breeds matching a query and filters, sorted; relevance ties fall back to popularity. */
export function searchBreeds(query: string, filters: BreedFilters = {}, sort: BreedSort = 'RELEVANCE', catalog: readonly BreedProfile[] = BREED_PROFILES): BreedProfile[] {
  const scored: Scored[] = catalog
    .map((profile) => ({ profile, score: scoreBreed(profile, query) }))
    .filter(({ profile, score }) => score > 0 && matchesFilters(profile, filters));
  const order = (a: Scored, b: Scored) => (sort === 'RELEVANCE' ? b.score - a.score || SORTS.POPULARITY(a.profile, b.profile) : SORTS[sort](a.profile, b.profile));
  return scored.sort(order).map(({ profile }) => profile);
}
