// Bland-diet portions: 2:1 carb to protein by weight, sized to the resting energy requirement, built only
// from SAFE foods, and deterministic.
import { BLAND_PROFILES, restingEnergyKcal } from '../utils/blandDiet';
import { FOOD_CATALOG, findIngredient } from '../utils/catalog';
import { generateEmergencyPortion } from '../utils/recipeEngine';
import { parseWeightKg } from '../utils/weight';

const foods = (...ids: string[]) => ids.map((id) => findIngredient(id)!);

function ready(weightKg: number, ...ids: string[]) {
  const plan = generateEmergencyPortion(weightKg, foods(...ids));
  if (plan.status !== 'ready') throw new Error(`expected a ready plan, got ${plan.status}`);
  return plan;
}

const gramsOf = (plan: ReturnType<typeof ready>, item: string) => plan.breakdownHe.find((line) => line.item === item)?.grams ?? 0;

describe('generateEmergencyPortion', () => {
  it('gives a 10 kg dog 48 g rice and 24 g chicken per meal, four meals a day', () => {
    const plan = ready(10, 'white-rice', 'chicken-breast');
    expect(plan.breakdownHe).toEqual([
      { item: 'אורז לבן', grams: 48 },
      { item: 'חזה עוף', grams: 24 },
    ]);
    expect(plan.totalMealGrams).toBe(72);
    expect(plan.mealsPerDay).toBe(4);
  });

  it('adds pumpkin as 10% fiber and keeps the 2:1 ratio for the rest', () => {
    const plan = ready(10, 'white-rice', 'chicken-breast', 'pumpkin');
    expect(plan.breakdownHe).toEqual([
      { item: 'אורז לבן', grams: 47 },
      { item: 'חזה עוף', grams: 24 },
      { item: 'דלעת', grams: 8 },
    ]);
    expect(plan.totalMealGrams).toBe(79);
  });

  it.each([2, 5, 10, 25, 40, 70])('keeps carb ≈ 2 × protein for a %i kg dog', (weightKg) => {
    const plan = ready(weightKg, 'white-rice', 'chicken-breast');
    expect(Math.abs(gramsOf(plan, 'אורז לבן') - 2 * gramsOf(plan, 'חזה עוף'))).toBeLessThanOrEqual(1.5);
  });

  it.each([3, 12, 30, 60])('feeds about the resting energy requirement of a %i kg dog per day', (weightKg) => {
    const plan = ready(weightKg, 'potato', 'egg', 'carrot');
    const dailyKcal = plan.breakdownHe.reduce((sum, line) => {
      const id = FOOD_CATALOG.find((food) => food.nameHe === line.item)!.id;
      return sum + line.grams * BLAND_PROFILES[id]!.kcalPerGram * plan.mealsPerDay;
    }, 0);
    expect(dailyKcal / restingEnergyKcal(weightKg)).toBeCloseTo(1, 1);
  });

  it('scales by energy, not linearly: a big dog gets fewer grams per kg than a small one', () => {
    const perKg = (weightKg: number) => ready(weightKg, 'white-rice', 'chicken-breast').totalMealGrams / weightKg;
    expect(perKg(40)).toBeLessThan(perKg(5));
  });

  it('prefers chicken, then turkey, cottage and egg; rice, then potato and sweet potato', () => {
    expect(ready(10, 'egg', 'chicken-breast', 'sweet-potato', 'white-rice').recipe.titleHe).toBe('אורז לבן וחזה עוף');
    expect(ready(10, 'egg', 'sweet-potato').recipe.titleHe).toBe('בטטה וביצה');
  });

  it('never uses caution or toxic foods, even when they are passed in', () => {
    const plan = generateEmergencyPortion(10, foods('tuna', 'bread', 'onion', 'white-rice'));
    expect(plan).toEqual({ status: 'missing', missingHe: [expect.stringContaining('חלבון')] });
  });

  it('says what is missing', () => {
    expect(generateEmergencyPortion(10, [])).toEqual({ status: 'missing', missingHe: [expect.stringContaining('חלבון'), expect.stringContaining('פחמימה')] });
    expect(generateEmergencyPortion(10, foods('chicken-breast'))).toEqual({ status: 'missing', missingHe: [expect.stringContaining('פחמימה')] });
  });

  it.each([0, -3, 0.5, 91, Number.NaN, Number.POSITIVE_INFINITY])('rejects weight %p', (weightKg) => {
    expect(generateEmergencyPortion(weightKg, foods('white-rice', 'chicken-breast'))).toEqual({ status: 'invalid_weight' });
  });

  it('is deterministic', () => {
    expect(ready(17.5, 'white-rice', 'cottage', 'pumpkin')).toEqual(ready(17.5, 'white-rice', 'cottage', 'pumpkin'));
  });

  it('builds the recipe: per-kg daily portions, preparation steps and serving advice', () => {
    const plan = ready(10, 'white-rice', 'chicken-breast');
    expect(plan.recipe.ingredients).toEqual([
      { nameHe: 'אורז לבן', rawPortionGramsPerKg: 19.2 },
      { nameHe: 'חזה עוף', rawPortionGramsPerKg: 9.6 },
    ]);
    expect(plan.instructionsHe[1]).toContain('בלי מלח');
    expect(plan.instructionsHe[1]).toContain('עצם');
    expect(plan.recipe.stepsHe).toBe(plan.instructionsHe);
    expect(plan.recipe.servingAdviceHe).toContain('4 ארוחות');
    expect(plan.recipe.servingAdviceHe).toContain('לווטרינר');
  });
});

describe('parseWeightKg', () => {
  it.each([
    ['12', 12],
    ['12.5', 12.5],
    ['12,5', 12.5],
    [' 8 ', 8],
    ['', null],
    ['abc', null],
    ['0', null],
    ['-4', null],
    ['1e3', null],
  ])('%j → %p', (text, expected) => {
    expect(parseWeightKg(text)).toBe(expected);
  });
});
