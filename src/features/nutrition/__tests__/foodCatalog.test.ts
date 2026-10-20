// Catalog integrity: the products the spec requires, consistent prices, and no number without a source.
import { FOOD_CATALOG } from '../data/foodCatalog';
import { filterCatalog, withRecommendedFirst } from '../utils/catalogFilter';
import { parseLabelKcal } from '../utils/profile';

describe('food catalog', () => {
  it('has all 19 required products, with unique ids', () => {
    expect(FOOD_CATALOG).toHaveLength(19);
    expect(new Set(FOOD_CATALOG.map((p) => p.id)).size).toBe(19);
  });

  it('splits into 5 pouches, 10 dry foods and 4 supplements', () => {
    expect(filterCatalog(FOOD_CATALOG, 'POUCH', '')).toHaveLength(5);
    expect(filterCatalog(FOOD_CATALOG, 'DRY_KIBBLE', '')).toHaveLength(10);
    expect(filterCatalog(FOOD_CATALOG, 'SUPPLEMENT', '')).toHaveLength(4);
  });

  it.each(FOOD_CATALOG.map((p) => [p.id, p] as const))('%s: price range is consistent', (_id, product) => {
    const { min, max, avg } = product.priceRangeILS;
    expect(min).toBeGreaterThan(0);
    expect(max).toBeGreaterThanOrEqual(min);
    expect(avg).toBeCloseTo((min + max) / 2, 5);
  });

  it.each(FOOD_CATALOG.filter((p) => p.category !== 'SUPPLEMENT').map((p) => [p.id, p] as const))('%s: has a sourced kcal value or asks for the label', (_id, product) => {
    if (product.specSource === 'label-required') {
      expect(product.nutritionalSpecs.kcalPer100g).toBeNull();
    } else {
      expect(product.nutritionalSpecs.kcalPer100g).toBeGreaterThan(250);
      expect(product.nutritionalSpecs.kcalPer100g).toBeLessThan(450);
      expect(product.specReference).toMatch(/^https:\/\//);
    }
  });

  it('marks exactly the Aboriginal pouches as complementary', () => {
    expect(FOOD_CATALOG.filter((p) => p.dietRole === 'COMPLEMENTARY').map((p) => p.brand)).toEqual(['Aboriginal', 'Aboriginal', 'Aboriginal']);
  });

  it('gives every supplement label dosing text', () => {
    for (const product of FOOD_CATALOG.filter((p) => p.category === 'SUPPLEMENT')) expect(product.labelDosingHe?.length).toBeGreaterThan(20);
  });

  it('ships no product image yet (licensed images only)', () => {
    for (const product of FOOD_CATALOG) expect(product.imageUrl === null || product.imageUrl.startsWith('https://')).toBe(true);
  });
});

describe('catalog search', () => {
  it('matches Hebrew names, English names and brands, case-insensitively', () => {
    expect(filterCatalog(FOOD_CATALOG, 'ALL', 'royal').map((p) => p.id)).toEqual(['royal-canin-gsd-adult', 'royal-canin-maxi-adult']);
    expect(filterCatalog(FOOD_CATALOG, 'ALL', 'בונזו')).toHaveLength(2);
    expect(filterCatalog(FOOD_CATALOG, 'ALL', 'אבוריגינל')).toHaveLength(3); // geresh folded away
    expect(filterCatalog(FOOD_CATALOG, 'SUPPLEMENT', 'royal')).toEqual([]);
  });

  it('lists recommended products first, in order', () => {
    const ids = withRecommendedFirst(FOOD_CATALOG, ['grizzly-salmon-oil', 'royal-canin-gsd-adult']).map((p) => p.id);
    expect(ids.slice(0, 2)).toEqual(['grizzly-salmon-oil', 'royal-canin-gsd-adult']);
    expect(ids).toHaveLength(19);
  });
});

describe('parseLabelKcal', () => {
  it.each([
    ['380', 380],
    ['380.5', 380.5],
    ['95,5', 95.5],
    ['3', null], // half-typed
    ['3800', null], // kcal/kg typed by mistake
    ['', null],
    ['abc', null],
  ] as const)('%j → %p', (text, expected) => {
    expect(parseLabelKcal(text)).toBe(expected);
  });
});
