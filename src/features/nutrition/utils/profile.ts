import type { DogRow } from '@/lib/database.types';
import { ageInMonths } from '@/utils/date';

import type { ActivityLevel, DogNutritionProfile } from '../types';

/** The dog as the nutrition engine sees it; null without a stored weight (portions need one). */
export function nutritionProfileOf(dog: DogRow, activity: ActivityLevel, today?: string): DogNutritionProfile | null {
  if (dog.weight_kg == null || dog.weight_kg <= 0) return null;
  return {
    name: dog.name,
    weightKg: dog.weight_kg,
    ageMonths: ageInMonths(dog.birth_date, today),
    breedId: dog.breed_id,
    isLargeBreed: dog.size === 'large' || dog.size === 'giant',
    activity,
  };
}

/** Plausible energy for dog food, kcal per 100 g as fed: from wet food (~70) to energy-dense dry food (~450). */
export const LABEL_KCAL_RANGE = { min: 40, max: 600 } as const;

/**
 * Parses kcal per 100 g typed from a pack ("380", "380.5"). Values outside the plausible range are
 * rejected (null) – a half-typed "3" or a kcal/kg figure (3800) must not produce a portion.
 */
export function parseLabelKcal(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value >= LABEL_KCAL_RANGE.min && value <= LABEL_KCAL_RANGE.max ? value : null;
}
