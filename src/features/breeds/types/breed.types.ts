// The breed-intelligence contracts: FCI classification, phenotype, historical origin, drive radar,
// behavioural risks and the clinical profile. Ratings are breed tendencies, never a verdict on one dog.

/** A 1–5 rating (5 = the most of the trait). */
export type Scale5 = 1 | 2 | 3 | 4 | 5;

export type FciGroup = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface FciClassification {
  group: FciGroup;
  /** Only when checked against the FCI nomenclature. */
  section?: number;
  /** Only when checked against the FCI nomenclature (fci.be). */
  standardNumber?: number;
  groupNameHe: string;
}

export type SizeCategory = 'TOY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'GIANT';
export type CoatType = 'SHORT_SINGLE' | 'DOUBLE_COAT' | 'WIRE' | 'CURLY_NON_SHEDDING' | 'LONG_SILKY';

export interface Range {
  min: number;
  max: number;
}

export interface PhysicalPhenotype {
  sizeCategory: SizeCategory;
  maleWeightKg: Range;
  femaleWeightKg: Range;
  maleHeightCm: Range;
  femaleHeightCm: Range;
  coatType: CoatType;
  sheddingLevel: Scale5;
  droolTendency: Scale5;
}

export interface HistoricalGenesis {
  centuryOfOrigin: string;
  countryOfOrigin: string;
  ancestorBreeds: readonly string[];
  founderOrHistoricalKeyFigures: string;
  originalUtilityAndFunction: string;
  historicalContextNarrativeHe: string;
}

export interface DriveAndTemperamentRadar {
  preyDrive: Scale5;
  defenseDrive: Scale5;
  packDriveSocial: Scale5;
  playDrive: Scale5;
  handlerFocusBiddability: Scale5;
  environmentalSensitivity: Scale5;
  energyStaminaHoursDaily: number;
  mentalStimulationRequirementHe: string;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface BehavioralRiskMatrix {
  separationAnxietyRisk: RiskLevel | 'CRITICAL';
  leashReactivityPredisposition: RiskLevel;
  resourceGuardingTendency: RiskLevel;
  vocalizationProfile: { tendency: Scale5; commonTriggersHe: readonly string[] };
  /** What a bored, under-stimulated dog of the breed typically does. */
  understimulationFalloutHe: string;
  recommendedHandlingStyleHe: string;
}

export type ConditionSeverity = 'CHRONIC' | 'PROGRESSIVE' | 'LIFE_THREATENING';

export interface GeneticVulnerability {
  conditionNameHe: string;
  conditionNameEn: string;
  pathologySummaryHe: string;
  severity: ConditionSeverity;
  recommendedScreeningProtocol: string;
}

export type BoasGrade = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

export interface ClinicalVeterinaryProfile {
  geneticVulnerabilities: readonly GeneticVulnerability[];
  bloatGdvRisk: { hasHighPredisposition: boolean; chestConformationNotesHe: string };
  anesthesiaMdr1Risk: { isMdr1Prone: boolean; precautionsHe: string };
  brachycephalicBoasGrade?: BoasGrade;
  averageLongevityYears: Range;
}

export type LivingSuitability = 'APARTMENT_FRIENDLY' | 'NEEDS_YARD';
export type ExperienceLevel = 'NOVICE_FRIENDLY' | 'EXPERIENCED_ONLY';

export interface BreedProfile {
  /** The slug stored in dogs.breed_id (src/features/dogs/breeds.ts). */
  id: string;
  names: { he: string; en: string; original: string };
  tags: readonly string[];
  /** Spellings people search with: abbreviations, transliterations, nicknames, in both scripts. */
  aliases: readonly string[];
  /** null for dogs no FCI standard covers (the American Pit Bull Terrier, mixed breeds). */
  fci: FciClassification | null;
  phenotype: PhysicalPhenotype;
  genesis: HistoricalGenesis;
  drives: DriveAndTemperamentRadar;
  behavior: BehavioralRiskMatrix;
  clinical: ClinicalVeterinaryProfile;
  suitability: { living: LivingSuitability; experience: ExperienceLevel };
  /** Rank in the American Kennel Club's 2024 registration statistics (United States); absent when the AKC doesn't rank it. */
  popularity?: { akcRank2024: number; akcBreedNameEn: string };
}
