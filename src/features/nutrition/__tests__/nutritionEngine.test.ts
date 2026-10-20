// Nutrition engine for Jackson (German Shepherd, 35 kg, adult): energy, the 15% training reserve, practical
// portions per product type, and the data rules that keep the numbers honest.
import { findProduct } from '../data/foodCatalog';
import type { DogNutritionProfile, FoodProduct } from '../types';
import { breedAdviceFor } from '../utils/breedAdvisor';
import { energyBudget, restingEnergyKcal } from '../utils/energy';
import { CUP_NAMES, POUCH_NAMES, unitsHe } from '../utils/format';
import { buildNutritionPlan } from '../utils/nutritionEngine';

const JACKSON: DogNutritionProfile = { name: 'ג׳קסון', weightKg: 35, ageMonths: 48, breedId: 'german-shepherd', isLargeBreed: true, activity: 'normal' };
const product = (id: string) => findProduct(id)!;
const serving = (p: FoodProduct, profile = JACKSON, labelKcalPer100g?: number) => buildNutritionPlan(profile, p, { labelKcalPer100g }).serving;

describe('energy and the training reserve', () => {
  it('computes Jackson’s resting energy: 70 × 35^0.75 ≈ 1007 kcal', () => {
    expect(Math.round(restingEnergyKcal(35))).toBe(1007);
  });

  it.each([
    ['low', 1410, 212, 1198],
    ['normal', 1612, 242, 1370],
    ['active', 1813, 272, 1541],
  ] as const)('%s: %i kcal a day, %i for treats (15%%), %i for the bowl', (activity, daily, treats, bowl) => {
    const budget = energyBudget({ weightKg: 35, activity });
    expect(budget).toMatchObject({ restingKcal: 1007, dailyKcal: daily, treatKcal: treats, bowlKcal: bowl, treatSharePercent: 15 });
  });

  it('always splits the whole day between treats and bowl', () => {
    for (const weightKg of [3, 12.5, 35, 61]) {
      const budget = energyBudget({ weightKg, activity: 'active' });
      expect(budget.treatKcal + budget.bowlKcal).toBe(budget.dailyKcal);
      expect(budget.treatKcal / budget.dailyKcal).toBeCloseTo(0.15, 2);
    }
  });

  it('takes a different reserve share when asked', () => {
    expect(buildNutritionPlan(JACKSON, product('bonzo-classic'), { treatShare: 0.1 }).budget).toMatchObject({ treatKcal: 161, bowlKcal: 1451, treatSharePercent: 10 });
  });
});

describe('dry food: cups and grams', () => {
  it('Royal Canin German Shepherd (85 g cup): 4.3 cups a day for Jackson', () => {
    expect(serving(product('royal-canin-gsd-adult'))).toMatchObject({
      status: 'ready',
      headlineHe: '4.3 כוסות ביום',
      detailHe: '2.15 כוסות בבוקר ו2.15 כוסות בערב, ~365 גרם ביום',
      unitsPerDay: 4.3,
    });
  });

  it('Royal Canin on an active day: 4.8 cups, ~410 g', () => {
    expect(serving(product('royal-canin-gsd-adult'), { ...JACKSON, activity: 'active' })).toMatchObject({ headlineHe: '4.8 כוסות ביום', detailHe: expect.stringContaining('~410 גרם') });
  });

  it('Bonzo Classic without a kcal-per-cup label: standard 100 g cup, with a note', () => {
    const plan = serving(product('bonzo-classic'));
    expect(plan).toMatchObject({ status: 'ready', headlineHe: '3.8 כוסות ביום', detailHe: '1.9 כוסות בבוקר ו1.9 כוסות בערב, ~380 גרם ביום' });
    expect(plan.status === 'ready' && plan.noteHe).toContain('100 גרם');
  });

  it('Bonzo Gold publishes no kcal: asks for the label value, then computes from it', () => {
    expect(serving(product('bonzo-gold'))).toEqual({ status: 'needs_label_kcal' });
    expect(serving(product('bonzo-gold'), JACKSON, 360)).toMatchObject({ status: 'ready', headlineHe: '3.8 כוסות ביום' });
  });
});

describe('pouches', () => {
  it('never sizes Aboriginal (a complementary food) as the whole diet', () => {
    for (const id of ['aboriginal-chicken', 'aboriginal-beef', 'aboriginal-turkey-fish']) {
      expect(serving(product(id), JACKSON, 150)).toEqual({ status: 'complementary_only' });
    }
  });

  it('gives whole/half pouches split morning and evening: "2 שקיות ביום"', () => {
    const pouch: FoodProduct = { ...product('canis-nature'), dietRole: 'COMPLETE', unitWeightGrams: 500, nutritionalSpecs: { ...product('canis-nature').nutritionalSpecs, kcalPer100g: 137 } };
    expect(serving(pouch)).toMatchObject({ status: 'ready', headlineHe: '2 שקיות ביום', detailHe: 'שקית אחת בבוקר, שקית אחת בערב (~1000 גרם ביום)', unitsPerDay: 2 });
  });

  it('Canis Nature (250 g units) from a label value, asking to confirm it is a complete food', () => {
    const plan = serving(product('canis-nature'), JACKSON, 180);
    expect(plan).toMatchObject({ status: 'ready', headlineHe: '3 שקיות ביום', detailHe: 'שקית וחצי בבוקר, שקית וחצי בערב (~760 גרם ביום)' });
    expect(plan.status === 'ready' && plan.noteHe).toContain('מזון מלא');
  });

  it('a pouch without a known unit weight gets grams only', () => {
    expect(serving(product('benjis-cooked'), JACKSON, 150)).toMatchObject({ status: 'ready', headlineHe: '~915 גרם ביום', unitsPerDay: 0 });
  });
});

describe('supplements', () => {
  it('salmon oil: label dosing plus the joint EPA+DHA range for 35 kg (~4,461–5,324 mg)', () => {
    const plan = serving(product('grizzly-salmon-oil'));
    expect(plan).toMatchObject({ status: 'supplement', labelDosingHe: expect.stringContaining('טבלת המשאבות') });
    expect(plan.status === 'supplement' && plan.omega3TargetHe).toMatch(/4,461–5,324/);
  });

  it('other supplements: the label only, never an invented dose', () => {
    expect(serving(product('glucosamine-chondroitin'))).toEqual({ status: 'supplement', labelDosingHe: expect.stringContaining('לפי משקל הכלב') });
  });
});

describe('age limits', () => {
  it.each([
    [15, true, 'unsupported_age'],
    [20, true, 'ready'],
    [10, false, 'unsupported_age'],
    [13, false, 'ready'],
  ] as const)('%i months, large breed %s → %s', (ageMonths, isLargeBreed, status) => {
    expect(serving(product('bonzo-classic'), { ...JACKSON, ageMonths, isLargeBreed }).status).toBe(status);
  });
});

describe('breed advisor', () => {
  it('flags dysplasia, bloat and a sensitive gut for German Shepherds', () => {
    const advice = breedAdviceFor(JACKSON);
    const alerts = advice.alertsHe.join(' ');
    expect(alerts).toContain('דיספלזיה');
    expect(alerts).toContain('היפוך קיבה');
    expect(alerts).toContain('עיכול רגיש');
    expect(advice.adviceHe.join(' ')).toContain('שעה לפני ושעה אחרי');
    expect(advice.recommendedProductIds).toEqual(expect.arrayContaining(['royal-canin-gsd-adult', 'grizzly-salmon-oil']));
  });

  it('recommends only catalog products that are complete foods or supplements', () => {
    for (const id of breedAdviceFor(JACKSON).recommendedProductIds) {
      expect(['COMPLETE', 'SUPPLEMENT']).toContain(product(id).dietRole);
    }
  });

  it('falls back by size', () => {
    expect(breedAdviceFor({ breedId: 'labrador', isLargeBreed: true }).titleHe).toBe('טיפים לכלבים גדולים');
    expect(breedAdviceFor({ breedId: 'mixed', isLargeBreed: false }).recommendedProductIds).toEqual([]);
  });
});

describe('Hebrew quantities', () => {
  it.each([
    [0.5, POUCH_NAMES, 'חצי שקית'],
    [1, POUCH_NAMES, 'שקית אחת'],
    [1.5, POUCH_NAMES, 'שקית וחצי'],
    [1.25, CUP_NAMES, 'כוס ורבע'],
    [0.75, CUP_NAMES, 'שלושה רבעי כוס'],
    [2, POUCH_NAMES, '2 שקיות'],
    [2.15, CUP_NAMES, '2.15 כוסות'],
  ] as const)('%p → %s', (value, unit, expected) => {
    expect(unitsHe(value, unit)).toBe(expected);
  });
});
