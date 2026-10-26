import { DRIVE_KEYS, DRIVE_LABELS_HE, type DriveKey } from '../data/breedLabels';
import { BREED_PROFILES } from '../data/breedsSeedData';
import type { BoasGrade, BreedProfile, Range } from '../types';

// Side-by-side breed comparison: drive deltas, energy, maintenance and the clinical liabilities that
// differ – what a family should weigh before choosing between two breeds.

export interface DriveDelta {
  key: DriveKey;
  labelHe: string;
  a: number;
  b: number;
  /** b minus a. */
  delta: number;
}

export interface BreedComparison {
  a: BreedProfile;
  b: BreedProfile;
  drives: DriveDelta[];
  energyHours: { a: number; b: number; delta: number };
  maintenance: { shedding: { a: number; b: number }; drool: { a: number; b: number } };
  longevity: { a: Range; b: Range };
  clinical: {
    /** Conditions both breeds carry (by English name). */
    shared: string[];
    onlyA: string[];
    onlyB: string[];
    gdv: { a: boolean; b: boolean };
    mdr1: { a: boolean; b: boolean };
    boas: { a: BoasGrade; b: BoasGrade };
  };
}

const conditionNames = (profile: BreedProfile) => profile.clinical.geneticVulnerabilities.map((condition) => condition.conditionNameEn);

/** Compares two breeds by id; null when either id is unknown or both are the same breed. */
export function compareBreeds(breedAId: string, breedBId: string, catalog: readonly BreedProfile[] = BREED_PROFILES): BreedComparison | null {
  const a = catalog.find((profile) => profile.id === breedAId);
  const b = catalog.find((profile) => profile.id === breedBId);
  if (!a || !b || a.id === b.id) return null;
  const namesA = conditionNames(a);
  const namesB = conditionNames(b);
  return {
    a,
    b,
    drives: DRIVE_KEYS.map((key) => ({ key, labelHe: DRIVE_LABELS_HE[key], a: a.drives[key], b: b.drives[key], delta: b.drives[key] - a.drives[key] })),
    energyHours: { a: a.drives.energyStaminaHoursDaily, b: b.drives.energyStaminaHoursDaily, delta: b.drives.energyStaminaHoursDaily - a.drives.energyStaminaHoursDaily },
    maintenance: {
      shedding: { a: a.phenotype.sheddingLevel, b: b.phenotype.sheddingLevel },
      drool: { a: a.phenotype.droolTendency, b: b.phenotype.droolTendency },
    },
    longevity: { a: a.clinical.averageLongevityYears, b: b.clinical.averageLongevityYears },
    clinical: {
      shared: namesA.filter((name) => namesB.includes(name)),
      onlyA: namesA.filter((name) => !namesB.includes(name)),
      onlyB: namesB.filter((name) => !namesA.includes(name)),
      gdv: { a: a.clinical.bloatGdvRisk.hasHighPredisposition, b: b.clinical.bloatGdvRisk.hasHighPredisposition },
      mdr1: { a: a.clinical.anesthesiaMdr1Risk.isMdr1Prone, b: b.clinical.anesthesiaMdr1Risk.isMdr1Prone },
      boas: { a: a.clinical.brachycephalicBoasGrade ?? 'NONE', b: b.clinical.brachycephalicBoasGrade ?? 'NONE' },
    },
  };
}
