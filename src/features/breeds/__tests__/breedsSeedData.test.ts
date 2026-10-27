// The breed catalog's integrity: exactly 75 complete profiles, no empty fields, valid and plausible ranges and
// ratings, verified-only FCI/AKC numbers, the documented founders and conditions, a two-way match with the
// dogs.breed_id picker, the training engine's work-drive flag, and agreement with breed-match.
import { BREEDS_CATALOG } from '@/features/breed-match/data/breedsCatalog';
import { BREED_BY_ID, BREEDS } from '@/features/dogs/breeds';

import { BREED_PROFILES } from '../data/breedsSeedData';
import { FCI_GROUP_NAMES_HE } from '../data/fciGroups';
import type { FciGroup, Range, SizeCategory } from '../types';
import { findBreedProfile, isHighDriveWorkingBreed } from '../utils/breedTraits';

/** Every string and array reachable from a value, with its path. */
function leaves(value: unknown, path = ''): { path: string; value: unknown }[] {
  if (Array.isArray(value)) return value.length === 0 ? [{ path, value }] : value.flatMap((item, i) => leaves(item, `${path}[${i}]`));
  if (typeof value === 'object' && value !== null) return Object.entries(value).flatMap(([key, item]) => leaves(item, `${path}.${key}`));
  return [{ path, value }];
}

const overlaps = (a: Range, b: { min: number; max: number }) => a.min <= b.max && b.min <= a.max;

/** The twelve profiles the catalog started with; all are FCI-recognised and AKC-ranked. */
const FOUNDATIONAL_IDS = ['german-shepherd', 'belgian-malinois', 'border-collie', 'australian-shepherd', 'rottweiler', 'doberman', 'cane-corso', 'golden-retriever', 'french-bulldog', 'cavalier', 'husky', 'jack-russell'];
/** Picker slugs with no profile: a mixed-breed dog, and the standard poodle (one FCI breed with the `poodle` profile). */
const PICKER_WITHOUT_PROFILE = ['mixed', 'standard-poodle'];
/** Breeds no FCI standard covers. */
const NO_FCI_STANDARD = ['pit-bull'];

describe('breed catalog', () => {
  it('has exactly 75 breeds with unique ids and names', () => {
    expect(BREED_PROFILES).toHaveLength(75);
    for (const key of ['id', 'he', 'en'] as const) {
      const values = BREED_PROFILES.map((profile) => (key === 'id' ? profile.id : profile.names[key]));
      expect(new Set(values).size).toBe(75);
    }
  });

  it('matches the dogs.breed_id picker in both directions', () => {
    for (const profile of BREED_PROFILES) expect({ id: profile.id, pickable: BREED_BY_ID.has(profile.id) }).toEqual({ id: profile.id, pickable: true });
    const withoutProfile = BREEDS.filter((breed) => findBreedProfile(breed.id) === undefined).map((breed) => breed.id);
    expect(withoutProfile).toEqual(PICKER_WITHOUT_PROFILE);
    expect(BREEDS).toHaveLength(75 + PICKER_WITHOUT_PROFILE.length);
  });

  it('covers every FCI group and every size category', () => {
    const groups = new Set(BREED_PROFILES.flatMap((profile) => (profile.fci ? [profile.fci.group] : [])));
    expect([...groups].sort((a, b) => a - b)).toEqual<FciGroup[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const sizes = new Set(BREED_PROFILES.map((profile) => profile.phenotype.sizeCategory));
    expect([...sizes].sort()).toEqual<SizeCategory[]>(['GIANT', 'LARGE', 'MEDIUM', 'SMALL', 'TOY']);
  });

  it('has no empty strings, empty arrays or placeholders', () => {
    const problems = BREED_PROFILES.flatMap((profile) =>
      leaves(profile, profile.id).filter(({ value }) => (typeof value === 'string' && (value.trim() === '' || /TODO|TBD|placeholder|lorem/i.test(value))) || (Array.isArray(value) && value.length === 0)),
    );
    expect(problems).toEqual([]);
  });

  it.each(BREED_PROFILES.map((profile) => [profile.id, profile] as const))('%s has valid, plausible ranges and ratings', (_id, profile) => {
    const { phenotype, drives, clinical } = profile;
    for (const range of [phenotype.maleWeightKg, phenotype.femaleWeightKg, phenotype.maleHeightCm, phenotype.femaleHeightCm, clinical.averageLongevityYears]) {
      expect(range.min).toBeGreaterThan(0);
      expect(range.min).toBeLessThanOrEqual(range.max);
    }
    for (const height of [phenotype.maleHeightCm, phenotype.femaleHeightCm]) {
      expect(height.min).toBeGreaterThanOrEqual(15);
      expect(height.max).toBeLessThanOrEqual(100);
    }
    expect(phenotype.maleWeightKg.max).toBeGreaterThanOrEqual(phenotype.femaleWeightKg.min);
    expect(clinical.averageLongevityYears.min).toBeGreaterThanOrEqual(5);
    expect(clinical.averageLongevityYears.max).toBeLessThanOrEqual(20);
    expect(drives.energyStaminaHoursDaily).toBeGreaterThanOrEqual(0.5);
    expect(drives.energyStaminaHoursDaily).toBeLessThanOrEqual(4);
    if (phenotype.sizeCategory === 'TOY') expect(phenotype.maleWeightKg.max).toBeLessThanOrEqual(8);
    if (phenotype.sizeCategory === 'GIANT') expect(phenotype.maleWeightKg.max).toBeGreaterThanOrEqual(45);
    for (const rating of [phenotype.sheddingLevel, phenotype.droolTendency, drives.preyDrive, drives.defenseDrive, drives.packDriveSocial, drives.playDrive, drives.handlerFocusBiddability, drives.environmentalSensitivity, profile.behavior.vocalizationProfile.tendency]) {
      expect(Number.isInteger(rating)).toBe(true);
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    }
    expect(clinical.geneticVulnerabilities.length).toBeGreaterThanOrEqual(2);
  });

  it.each(BREED_PROFILES.map((profile) => [profile.id, profile] as const))('%s has consistent FCI and AKC data where present', (id, profile) => {
    const { fci, popularity } = profile;
    expect(fci === null).toBe(NO_FCI_STANDARD.includes(id));
    if (fci) {
      expect(fci.groupNameHe).toBe(FCI_GROUP_NAMES_HE[fci.group]);
      if (fci.section !== undefined) expect(Number.isInteger(fci.section) && fci.section > 0).toBe(true);
      if (fci.standardNumber !== undefined) expect(Number.isInteger(fci.standardNumber) && fci.standardNumber > 0).toBe(true);
    }
    if (popularity) {
      expect(Number.isInteger(popularity.akcRank2024)).toBe(true);
      expect(popularity.akcRank2024).toBeGreaterThanOrEqual(1);
      expect(popularity.akcRank2024).toBeLessThanOrEqual(300);
      expect(popularity.akcBreedNameEn.trim()).not.toBe('');
    }
  });

  it('keeps full FCI and AKC data on the twelve foundational breeds', () => {
    for (const id of FOUNDATIONAL_IDS) {
      const profile = findBreedProfile(id);
      expect({ id, standard: profile?.fci?.standardNumber !== undefined, ranked: profile?.popularity !== undefined }).toEqual({ id, standard: true, ranked: true });
    }
  });

  it('gives each AKC rank to one breed only', () => {
    const ranks = BREED_PROFILES.flatMap((profile) => (profile.popularity ? [profile.popularity.akcRank2024] : []));
    expect(new Set(ranks).size).toBe(ranks.length);
  });

  it('names the documented founders', () => {
    const founders = (id: string) => findBreedProfile(id)?.genesis.founderOrHistoricalKeyFigures ?? '';
    expect(founders('german-shepherd')).toMatch(/פון שטפניץ/);
    expect(founders('doberman')).toMatch(/לואיס דוברמן/);
    expect(founders('golden-retriever')).toMatch(/טוודמאות׳/);
    expect(founders('jack-russell')).toMatch(/ג׳ון "ג׳ק" ראסל/);
    expect(founders('canaan-dog')).toMatch(/מנצל/);
  });

  it('references the recognised clinical conditions', () => {
    const conditions = BREED_PROFILES.flatMap((profile) => profile.clinical.geneticVulnerabilities.map((condition) => condition.conditionNameEn)).join(' | ');
    for (const name of ['Hip and Elbow Dysplasia', 'Degenerative Myelopathy', 'Dilated Cardiomyopathy', 'Syringomyelia', 'Brachycephalic Obstructive Airway Syndrome', 'MDR1', 'Intervertebral Disc Disease', 'Deafness', 'Patellar Luxation']) expect(conditions).toContain(name);
    expect(BREED_PROFILES.some((profile) => profile.clinical.bloatGdvRisk.hasHighPredisposition)).toBe(true);
  });

  it('grades the airway of the brachycephalic breeds and flags MDR1 in the collie family', () => {
    for (const id of ['french-bulldog', 'english-bulldog', 'pug', 'shih-tzu', 'boston-terrier']) expect({ id, boas: findBreedProfile(id)?.clinical.brachycephalicBoasGrade }).toEqual({ id, boas: expect.stringMatching(/MILD|MODERATE|SEVERE/) });
    for (const id of ['collie', 'shetland-sheepdog', 'border-collie', 'australian-shepherd']) expect({ id, mdr1: findBreedProfile(id)?.clinical.anesthesiaMdr1Risk.isMdr1Prone }).toEqual({ id, mdr1: true });
  });

  it('never frames dogs by dominance', () => {
    expect(JSON.stringify(BREED_PROFILES)).not.toMatch(/אלפא|דומיננט|alpha|dominan/i);
  });

  it('flags exactly the high-drive working breeds for the training engine', () => {
    const flagged = BREED_PROFILES.filter(isHighDriveWorkingBreed).map((profile) => profile.id).sort();
    expect(flagged).toEqual(['australian-cattle-dog', 'belgian-malinois', 'border-collie', 'doberman', 'dutch-shepherd', 'german-shepherd', 'giant-schnauzer']);
  });

  it('agrees with the breed-match catalog on weight and lifespan for shared breeds', () => {
    const shared = BREEDS_CATALOG.filter((breed) => findBreedProfile(breed.id) !== undefined);
    expect(shared.length).toBeGreaterThanOrEqual(13);
    for (const breed of shared) {
      const profile = findBreedProfile(breed.id);
      if (!profile) continue;
      const weight = { min: Math.min(profile.phenotype.femaleWeightKg.min, profile.phenotype.maleWeightKg.min), max: Math.max(profile.phenotype.femaleWeightKg.max, profile.phenotype.maleWeightKg.max) };
      expect({ id: breed.id, weight: overlaps(weight, breed.weightRangeKg), life: overlaps(profile.clinical.averageLongevityYears, breed.lifeExpectancyYears) }).toEqual({ id: breed.id, weight: true, life: true });
    }
  });
});
