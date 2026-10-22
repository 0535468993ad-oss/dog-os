export type BreedSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'GIANT';

/** Broad grouping used for the catalog sections (roughly the FCI groups, plus local rescue archetypes). */
export type BreedCategory = 'WORKING_GUARDIAN' | 'HERDING' | 'SPORTING' | 'RETRIEVER' | 'COMPANION' | 'TOY' | 'RESCUE_ARCHETYPE';

/** How the dog is responsibly acquired: from an IKC-registered breeder, or adopted from a shelter/foster. */
export type AcquisitionRoute = 'IKC_BREEDER' | 'RESCUE';

/** A 1–5 rating (5 = the most of the trait). */
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface BreedMetrics {
  energyLevel: Rating;
  mentalStimulationNeed: Rating;
  sheddingLevel: Rating;
  droolingLevel: Rating;
  kidCompatibility: Rating;
  strangerFriendliness: Rating;
  dogSociability: Rating;
  barkingTendency: Rating;
  groomingEffort: Rating;
  noviceFriendly: Rating;
  /** Innate predatory motor pattern (eye–stalk–chase–grab), relevant with cats and small pets. */
  preyDrive: Rating;
}

export interface BreedTolerances {
  maxAloneHoursPerDay: number;
  minExerciseMinutesPerDay: number;
  apartmentSuitable: boolean;
  /** Low-shedding coat. No dog is allergen-free: Can f 1 is in saliva and dander, not only in hair. */
  hypoallergenic: boolean;
  /** Brachycephalic or heavy-coated: exertion in the Israeli summer risks heat stroke. */
  heatSensitive: boolean;
}

export interface IsraeliEconomics {
  estimatedMonthlyFoodILS: number;
  /** Insurance premium (e.g. Hayuta, Phoenix) plus preventive care: vaccines, flea/tick, deworming, checkups. */
  estimatedMonthlyInsuranceAndVetILS: number;
  estimatedMonthlyGroomingILS: number;
  /** For RESCUE archetypes this is the adoption basket (סל אימוץ), not a breeder price. */
  ikcPuppyPriceRangeILS: { min: number; max: number };
}

export interface MedicalAndGenetics {
  commonVulnerabilitiesHe: readonly string[];
  /** What a buyer must see before paying (for RESCUE: what to ask the shelter). */
  mandatoryParentClearancesHe: readonly string[];
}

export interface BreedProfile {
  id: string;
  nameHe: string;
  nameEn: string;
  category: BreedCategory;
  acquisition: AcquisitionRoute;
  size: BreedSize;
  weightRangeKg: { min: number; max: number };
  lifeExpectancyYears: { min: number; max: number };
  metrics: BreedMetrics;
  tolerances: BreedTolerances;
  israeliEconomics: IsraeliEconomics;
  medicalAndGenetics: MedicalAndGenetics;
  realityCheckWarningHe: string;
  /** The IKC club responsible for the breed, when one is known (see data/ikcClubs). */
  ikcClubId?: ClubId;
}

export type ClubId = 'shepherd' | 'retriever' | 'working-sport' | 'toy' | 'spitz';

export interface IkcClub {
  id: ClubId;
  nameHe: string;
  scopeHe: string;
}

export type IsraelRegion = 'CENTER' | 'NORTH' | 'SOUTH' | 'JERUSALEM';

export interface RescueOrganization {
  id: string;
  nameHe: string;
  region: IsraelRegion;
  areaHe: string;
  noteHe: string;
  /** Only addresses we could confirm; otherwise the user searches the name. */
  website?: string;
}
