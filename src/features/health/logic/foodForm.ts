import type { FoodInput } from '../api';

export interface FoodFormValues {
  foodName: string;
  kcal: string;
  meals: string;
  gramsOverride: string;
}

export interface FoodFormErrors {
  foodName?: string;
  meals?: string;
  grams?: string;
}

/** Parses a typed number, accepting a decimal comma; NaN when empty or invalid. */
export function parseDecimal(input: string): number {
  return input.trim() ? Number(input.trim().replace(',', '.')) : NaN;
}

/** Meals per day as a whole number (rounded). */
export function parseMeals(input: string): number {
  return Math.round(parseDecimal(input));
}

/**
 * Validates the food form and builds the record to save. Grams per meal come from the manual field, or
 * else from the calculator's suggestion.
 */
export function buildFoodInput(values: FoodFormValues, suggestedGramsPerMeal: number | null): { input: FoodInput | null; errors: FoodFormErrors } {
  const mealsPerDay = parseMeals(values.meals);
  const kcal = parseDecimal(values.kcal);
  const grams = values.gramsOverride.trim() ? parseDecimal(values.gramsOverride) : (suggestedGramsPerMeal ?? NaN);

  const errors: FoodFormErrors = {};
  if (!values.foodName.trim()) errors.foodName = 'הזינו שם מזון.';
  if (!(mealsPerDay >= 1 && mealsPerDay <= 6)) errors.meals = 'בין 1 ל-6 ארוחות.';
  if (!(grams > 0 && grams <= 5000)) errors.grams = 'הזינו גרמים לארוחה, או מלאו את פרטי המחשבון.';
  if (Object.keys(errors).length) return { input: null, errors };

  return {
    input: {
      foodName: values.foodName.trim(),
      kcalPer100g: kcal > 0 ? kcal : null,
      gramsPerMeal: Math.round(grams * 10) / 10,
      mealsPerDay,
      notes: null,
    },
    errors,
  };
}
