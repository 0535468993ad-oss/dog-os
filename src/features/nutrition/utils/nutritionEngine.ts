import type { DogNutritionProfile, EnergyBudget, FoodProduct, ServingPlan } from '../types';
import { energyBudget, unsupportedAgeReason } from './energy';
import { servingFor } from './servingCalculator';
import { supplementPlan } from './supplementGuide';
import { TRAINING_TREAT_SHARE } from './trainingReserve';

export interface NutritionPlan {
  budget: EnergyBudget;
  serving: ServingPlan;
}

/**
 * The full plan for one dog and one product: the day's energy with the training reserve taken off the
 * bowl, and the practical portion of the product. Pure and deterministic.
 */
export function buildNutritionPlan(
  profile: DogNutritionProfile,
  product: FoodProduct,
  options: { labelKcalPer100g?: number | null; treatShare?: number } = {},
): NutritionPlan {
  const budget = energyBudget(profile, options.treatShare ?? TRAINING_TREAT_SHARE);
  if (product.category === 'SUPPLEMENT') return { budget, serving: supplementPlan(product, profile.weightKg) };

  const ageReason = unsupportedAgeReason(profile);
  if (ageReason) return { budget, serving: { status: 'unsupported_age', reasonHe: ageReason } };

  return { budget, serving: servingFor(product, budget.bowlKcal, options.labelKcalPer100g ?? null) };
}
