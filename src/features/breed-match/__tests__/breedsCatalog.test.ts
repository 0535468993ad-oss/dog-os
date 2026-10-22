// Dataset integrity: the required breeds exist, every field is in range, and the copy stays clear of
// dominance/alpha pseudoscience.
import { BREEDS_CATALOG } from '../data/breedsCatalog';
import { IKC_CLUBS } from '../data/ikcClubs';
import { RESCUE_ORGANIZATIONS } from '../data/rescueOrganizations';
import { TEMPERAMENT_PROFILES, VOLHARD_TESTS } from '../data/volhardProfiles';

const REQUIRED = [
  'german-shepherd', 'belgian-malinois', 'border-collie', 'golden-retriever', 'labrador', 'french-bulldog', 'poodle', 'cavalier',
  'shih-tzu', 'australian-shepherd', 'vizsla', 'boxer', 'cane-corso', 'chihuahua', 'pomeranian', 'canaan-mix', 'saluki-mix',
];

/** Pseudoscientific framing that must never describe a puppy or a test. */
const PSEUDOSCIENCE = /אלפא|דומיננטי|alpha|dominant/i;

describe('breeds catalog', () => {
  it('covers the required breeds and rescue archetypes with unique ids', () => {
    const ids = BREEDS_CATALOG.map((breed) => breed.id);
    expect(ids).toEqual(expect.arrayContaining(REQUIRED));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(16);
  });

  it.each(BREEDS_CATALOG.map((breed) => [breed.id, breed] as const))('%s has valid ranges and real content', (_id, breed) => {
    expect(Object.values(breed.metrics).every((value) => value >= 1 && value <= 5)).toBe(true);
    expect(breed.weightRangeKg.min).toBeLessThan(breed.weightRangeKg.max);
    expect(breed.lifeExpectancyYears.min).toBeLessThan(breed.lifeExpectancyYears.max);
    expect(breed.israeliEconomics.ikcPuppyPriceRangeILS.min).toBeLessThan(breed.israeliEconomics.ikcPuppyPriceRangeILS.max);
    expect(breed.medicalAndGenetics.commonVulnerabilitiesHe.length).toBeGreaterThanOrEqual(3);
    expect(breed.medicalAndGenetics.mandatoryParentClearancesHe.length).toBeGreaterThanOrEqual(2);
    expect(breed.realityCheckWarningHe.length).toBeGreaterThan(60);
    if (breed.ikcClubId) expect(IKC_CLUBS[breed.ikcClubId]).toBeDefined();
  });

  it('prices rescue archetypes at the adoption basket, not a breeder price', () => {
    const rescues = BREEDS_CATALOG.filter((breed) => breed.acquisition === 'RESCUE');
    expect(rescues.map((breed) => breed.id).sort()).toEqual(['canaan-mix', 'saluki-mix']);
    for (const rescue of rescues) expect(rescue.israeliEconomics.ikcPuppyPriceRangeILS).toEqual({ min: 700, max: 1000 });
  });
});

describe('rescue directory', () => {
  it('covers all four regions, with https websites only', () => {
    expect(new Set(RESCUE_ORGANIZATIONS.map((organization) => organization.region))).toEqual(new Set(['CENTER', 'NORTH', 'JERUSALEM', 'SOUTH']));
    for (const organization of RESCUE_ORGANIZATIONS) if (organization.website) expect(organization.website).toMatch(/^https:\/\//);
  });
});

describe('scientific integrity', () => {
  it('never frames a puppy profile or a test score as dominance or alpha', () => {
    const profileCopy = Object.values(TEMPERAMENT_PROFILES).flatMap((profile) => [profile.titleHe, profile.summaryHe, profile.bestHomeHe, profile.notForHe]);
    const testCopy = VOLHARD_TESTS.flatMap((test) => [test.nameHe, test.measuresHe, test.instructionsHe, ...Object.values(test.scoreDefinitionsHe)]);
    expect([...profileCopy, ...testCopy].filter((text) => PSEUDOSCIENCE.test(text))).toEqual([]);
  });

  it('says outright that restraint is not an alpha roll', () => {
    const restraint = VOLHARD_TESTS.find((test) => test.id === 'restraint');
    expect(restraint?.cautionHe).toMatch(/לא "גלגול אלפא"/);
  });
});
