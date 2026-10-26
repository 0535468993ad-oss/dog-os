// Breed search: Hebrew, English, abbreviations and transliterations, typo tolerance, facet filters
// and sorting – and the comparator built on the same catalog.
import { compareBreeds } from '../services/breedComparatorService';
import { matchesFilters, scoreBreed, searchBreeds } from '../services/breedSearchService';
import { findBreedProfile } from '../utils/breedTraits';
import { boundedLevenshtein, normalizeText } from '../utils/textNormalize';

const top = (query: string) => searchBreeds(query)[0]?.id;

describe('normalizeText', () => {
  it('folds case, geresh, Hebrew points, final letters and punctuation', () => {
    expect(normalizeText('ג׳ק-ראסל')).toBe('גק ראסל');
    expect(normalizeText('Schäferhund')).toBe('schaferhund');
    expect(normalizeText('כֶּלֶב')).toBe('כלב');
    expect(normalizeText('רועה גרמני ')).toBe('רועה גרמני');
    expect(normalizeText('ץ')).toBe('צ');
  });

  it('stops counting edits past the limit', () => {
    expect(boundedLevenshtein('husky', 'huskie', 2)).toBe(2);
    expect(boundedLevenshtein('malinois', 'poodle', 2)).toBe(3);
  });
});

describe('searchBreeds', () => {
  it.each([
    ['רועה גרמני', 'german-shepherd'],
    ['GSD', 'german-shepherd'],
    ['שפרד', 'german-shepherd'],
    ['German Shepherd', 'german-shepherd'],
    ['alsatian', 'german-shepherd'],
    ['מלינואה', 'belgian-malinois'],
    ['Mali', 'belgian-malinois'],
    ['פרנצ׳י', 'french-bulldog'],
    ['frenchie', 'french-bulldog'],
    ['גק ראסל', 'jack-russell'],
    ['JRT', 'jack-russell'],
    ['האסקי', 'husky'],
    ['Dobermann', 'doberman'],
    ['קורסו', 'cane-corso'],
    ['aussie', 'australian-shepherd'],
    ['CKCS', 'cavalier'],
  ])('finds "%s" → %s', (query, id) => {
    expect(top(query)).toBe(id);
  });

  it('tolerates typos', () => {
    expect(top('rottwiler')).toBe('rottweiler');
    expect(top('huskey')).toBe('husky');
    expect(top('malinoise')).toBe('belgian-malinois');
  });

  it('returns nothing for an unrelated query and everything for an empty one', () => {
    expect(searchBreeds('xyzzyqq')).toEqual([]);
    expect(searchBreeds('')).toHaveLength(12);
  });

  it('ranks an exact name above a partial match', () => {
    const gsd = findBreedProfile('german-shepherd');
    const aussie = findBreedProfile('australian-shepherd');
    if (!gsd || !aussie) throw new Error('missing profile');
    expect(scoreBreed(gsd, 'רועה גרמני')).toBeGreaterThan(scoreBreed(aussie, 'רועה גרמני'));
  });
});

describe('filters and sorting', () => {
  it('filters by living, experience, size and shedding', () => {
    const apartmentNovice = searchBreeds('', { living: 'APARTMENT_FRIENDLY', experience: 'NOVICE_FRIENDLY' }).map((p) => p.id);
    expect(apartmentNovice.sort()).toEqual(['cavalier', 'french-bulldog', 'golden-retriever']);
    expect(searchBreeds('', { sizes: ['TOY', 'SMALL'] }).map((p) => p.id).sort()).toEqual(['cavalier', 'french-bulldog', 'jack-russell']);
    expect(searchBreeds('', { maxShedding: 2 }).map((p) => p.id).sort()).toEqual(['doberman', 'french-bulldog']);
    expect(searchBreeds('', { nonShedding: true })).toEqual([]);
  });

  it('filters by medical risk: bloat and brachycephaly', () => {
    expect(searchBreeds('', { gdvRisk: true }).map((p) => p.id).sort()).toEqual(['cane-corso', 'doberman', 'german-shepherd', 'rottweiler']);
    expect(searchBreeds('', { brachycephalic: true }).map((p) => p.id).sort()).toEqual(['cavalier', 'french-bulldog']);
  });

  it('combines a query with filters', () => {
    const profile = findBreedProfile('german-shepherd');
    if (!profile) throw new Error('missing profile');
    expect(matchesFilters(profile, { living: 'APARTMENT_FRIENDLY' })).toBe(false);
    expect(searchBreeds('רועה', { gdvRisk: true }).map((p) => p.id)).toEqual(['german-shepherd']);
  });

  it('sorts by energy, popularity and longevity', () => {
    expect(searchBreeds('', {}, 'ENERGY')[0]?.id).toBe('belgian-malinois');
    expect(searchBreeds('', {}, 'POPULARITY').slice(0, 3).map((p) => p.id)).toEqual(['french-bulldog', 'golden-retriever', 'german-shepherd']);
    expect(searchBreeds('', {}, 'LONGEVITY')[0]?.id).toBe('jack-russell');
  });
});

describe('compareBreeds', () => {
  it('computes drive and energy deltas and the clinical differences', () => {
    const comparison = compareBreeds('german-shepherd', 'french-bulldog');
    if (!comparison) throw new Error('no comparison');
    expect(comparison.energyHours).toEqual({ a: 2, b: 0.75, delta: -1.25 });
    expect(comparison.drives.find((drive) => drive.key === 'preyDrive')).toMatchObject({ a: 4, b: 2, delta: -2 });
    expect(comparison.clinical.gdv).toEqual({ a: true, b: false });
    expect(comparison.clinical.boas).toEqual({ a: 'NONE', b: 'MODERATE' });
    expect(comparison.clinical.onlyA).toContain('Degenerative Myelopathy');
  });

  it('finds shared conditions and refuses unknown or identical breeds', () => {
    expect(compareBreeds('german-shepherd', 'rottweiler')?.clinical.shared).toEqual(['Hip and Elbow Dysplasia']);
    expect(compareBreeds('german-shepherd', 'german-shepherd')).toBeNull();
    expect(compareBreeds('german-shepherd', 'unicorn')).toBeNull();
  });
});
