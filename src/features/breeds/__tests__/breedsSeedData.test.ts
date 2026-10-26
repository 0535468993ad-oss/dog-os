// The breed catalog's integrity: twelve complete profiles, no empty fields, valid ranges and ratings,
// the documented founders and conditions, the dogs.breed_id slugs, and agreement with breed-match.
import { BREEDS_CATALOG } from '@/features/breed-match/data/breedsCatalog';
import { BREED_BY_ID } from '@/features/dogs/breeds';

import { BREED_PROFILES } from '../data/breedsSeedData';
import { FCI_GROUP_NAMES_HE } from '../data/fciGroups';
import type { Range } from '../types';
import { isHighDriveWorkingBreed } from '../utils/breedTraits';

/** Every string and array reachable from a value, with its path. */
function leaves(value: unknown, path = ''): { path: string; value: unknown }[] {
  if (Array.isArray(value)) return value.length === 0 ? [{ path, value }] : value.flatMap((item, i) => leaves(item, `${path}[${i}]`));
  if (typeof value === 'object' && value !== null) return Object.entries(value).flatMap(([key, item]) => leaves(item, `${path}.${key}`));
  return [{ path, value }];
}

const overlaps = (a: Range, b: { min: number; max: number }) => a.min <= b.max && b.min <= a.max;

describe('breed catalog', () => {
  it('has the twelve foundational breeds with unique ids that match dogs.breed_id', () => {
    const ids = BREED_PROFILES.map((profile) => profile.id);
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
    for (const id of ids) expect(BREED_BY_ID.has(id)).toBe(true);
  });

  it('has no empty strings, empty arrays or placeholders', () => {
    const problems = BREED_PROFILES.flatMap((profile) =>
      leaves(profile, profile.id).filter(({ value }) => (typeof value === 'string' && (value.trim() === '' || /TODO|TBD|placeholder|lorem/i.test(value))) || (Array.isArray(value) && value.length === 0)),
    );
    expect(problems).toEqual([]);
  });

  it.each(BREED_PROFILES.map((profile) => [profile.id, profile] as const))('%s has valid ranges, ratings and FCI data', (_id, profile) => {
    const { phenotype, drives, clinical, fci } = profile;
    for (const range of [phenotype.maleWeightKg, phenotype.femaleWeightKg, phenotype.maleHeightCm, phenotype.femaleHeightCm, clinical.averageLongevityYears]) {
      expect(range.min).toBeGreaterThan(0);
      expect(range.min).toBeLessThanOrEqual(range.max);
    }
    for (const rating of [phenotype.sheddingLevel, phenotype.droolTendency, drives.preyDrive, drives.defenseDrive, drives.packDriveSocial, drives.playDrive, drives.handlerFocusBiddability, drives.environmentalSensitivity]) {
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    }
    expect(fci.groupNameHe).toBe(FCI_GROUP_NAMES_HE[fci.group]);
    expect(fci.standardNumber).toBeGreaterThan(0);
    expect(clinical.geneticVulnerabilities.length).toBeGreaterThanOrEqual(2);
    expect(profile.popularity.akcRank2024).toBeGreaterThan(0);
  });

  it('names the documented founders', () => {
    const founders = (id: string) => BREED_PROFILES.find((profile) => profile.id === id)?.genesis.founderOrHistoricalKeyFigures ?? '';
    expect(founders('german-shepherd')).toMatch(/פון שטפניץ/);
    expect(founders('doberman')).toMatch(/לואיס דוברמן/);
    expect(founders('golden-retriever')).toMatch(/טוודמאות׳/);
    expect(founders('jack-russell')).toMatch(/ג׳ון "ג׳ק" ראסל/);
  });

  it('references the recognised clinical conditions', () => {
    const conditions = BREED_PROFILES.flatMap((profile) => profile.clinical.geneticVulnerabilities.map((condition) => condition.conditionNameEn)).join(' | ');
    for (const name of ['Hip and Elbow Dysplasia', 'Degenerative Myelopathy', 'Dilated Cardiomyopathy', 'Syringomyelia', 'Brachycephalic Obstructive Airway Syndrome', 'MDR1']) expect(conditions).toContain(name);
    expect(BREED_PROFILES.some((profile) => profile.clinical.bloatGdvRisk.hasHighPredisposition)).toBe(true);
  });

  it('never frames dogs by dominance', () => {
    expect(JSON.stringify(BREED_PROFILES)).not.toMatch(/אלפא|דומיננט|alpha|dominan/i);
  });

  it('flags the high-drive working breeds for the training engine', () => {
    const flagged = BREED_PROFILES.filter(isHighDriveWorkingBreed).map((profile) => profile.id).sort();
    expect(flagged).toEqual(['belgian-malinois', 'border-collie', 'doberman', 'german-shepherd']);
  });

  it('agrees with the breed-match catalog on weight and lifespan for shared breeds', () => {
    const shared = BREEDS_CATALOG.filter((breed) => BREED_PROFILES.some((profile) => profile.id === breed.id));
    expect(shared.length).toBeGreaterThanOrEqual(6);
    for (const breed of shared) {
      const profile = BREED_PROFILES.find((entry) => entry.id === breed.id);
      if (!profile) continue;
      const weight = { min: Math.min(profile.phenotype.femaleWeightKg.min, profile.phenotype.maleWeightKg.min), max: Math.max(profile.phenotype.femaleWeightKg.max, profile.phenotype.maleWeightKg.max) };
      expect({ id: breed.id, weight: overlaps(weight, breed.weightRangeKg), life: overlaps(profile.clinical.averageLongevityYears, breed.lifeExpectancyYears) }).toEqual({ id: breed.id, weight: true, life: true });
    }
  });
});
