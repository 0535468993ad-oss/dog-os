import type { FoodProduct, ServingPlan } from '../types';
import { approxGramsHe, CUP_NAMES, POUCH_NAMES, toHalf, unitsHe } from './format';

/** A level measuring cup of an average kibble, when the label gives no kcal per cup. */
export const STANDARD_CUP_GRAMS = 100;
export const MEALS_PER_DAY = 2;

const CONFIRM_COMPLETE_HE = 'בדקו שעל האריזה כתוב "מזון מלא". אם כתוב "מזון משלים" – הוא לא יכול להיות האוכל היחיד.';

/** kcal per 100 g: the catalog value, or the one typed from the pack. */
export function effectiveKcalPer100g(product: FoodProduct, labelKcalPer100g: number | null): number | null {
  return product.nutritionalSpecs.kcalPer100g ?? labelKcalPer100g;
}

/** Pouches: the day in half pouches (so each of the two meals is a whole quarter). Without a pouch weight, grams only. */
function pouchPlan(product: FoodProduct, dailyGrams: number): Extract<ServingPlan, { status: 'ready' }> {
  const grams = approxGramsHe(dailyGrams);
  if (!product.unitWeightGrams) {
    return { status: 'ready', headlineHe: `${grams} ביום`, detailHe: `חצי בבוקר וחצי בערב. שוקלים לפי המשקל שעל השקית.`, dailyGrams, unitsPerDay: 0 };
  }
  const perDay = Math.max(0.5, toHalf(dailyGrams / product.unitWeightGrams));
  const perMeal = perDay / MEALS_PER_DAY;
  return {
    status: 'ready',
    headlineHe: `${unitsHe(perDay, POUCH_NAMES)} ביום`,
    detailHe: `${unitsHe(perMeal, POUCH_NAMES)} בבוקר, ${unitsHe(perMeal, POUCH_NAMES)} בערב (${grams} ביום)`,
    dailyGrams,
    unitsPerDay: perDay,
  };
}

/** Dry food: cups to one decimal and grams, split evenly between morning and evening. */
function kibblePlan(product: FoodProduct, dailyGrams: number): Extract<ServingPlan, { status: 'ready' }> {
  const cupGrams = product.unitWeightGrams ?? STANDARD_CUP_GRAMS;
  const cups = Math.round((dailyGrams / cupGrams) * 10) / 10;
  const perMeal = Math.round((cups / MEALS_PER_DAY) * 100) / 100;
  return {
    status: 'ready',
    headlineHe: `${unitsHe(cups, CUP_NAMES)} ביום`,
    detailHe: `${unitsHe(perMeal, CUP_NAMES)} בבוקר ו${unitsHe(perMeal, CUP_NAMES)} בערב, ${approxGramsHe(dailyGrams)} ביום`,
    dailyGrams,
    unitsPerDay: cups,
    noteHe: product.unitWeightGrams ? undefined : `לפי כוס מדידה של כ־${STANDARD_CUP_GRAMS} גרם. הכי מדויק לשקול במשקל מטבח.`,
  };
}

/**
 * The daily portion of one food for the bowl's calories. Never sizes a complementary food as the whole
 * diet, and never guesses a calorie value the catalog doesn't have.
 */
export function servingFor(product: FoodProduct, bowlKcal: number, labelKcalPer100g: number | null): ServingPlan {
  if (product.dietRole === 'COMPLEMENTARY') return { status: 'complementary_only' };
  const kcal = effectiveKcalPer100g(product, labelKcalPer100g);
  if (!kcal || kcal <= 0) return { status: 'needs_label_kcal' };

  const dailyGrams = (bowlKcal / kcal) * 100;
  const plan = product.category === 'POUCH' ? pouchPlan(product, dailyGrams) : kibblePlan(product, dailyGrams);
  if (product.dietRole !== 'UNCONFIRMED') return plan;
  return { ...plan, noteHe: [plan.noteHe, CONFIRM_COMPLETE_HE].filter(Boolean).join(' ') };
}
