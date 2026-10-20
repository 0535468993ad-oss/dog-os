import type { IngredientDefinition } from '../../types';
import { CAUTION_FOODS } from './cautionFoods';
import { SAFE_FOODS } from './safeFoods';
import { TOXIC_FOODS } from './toxicFoods';

export { CAUTION_FOODS, SAFE_FOODS, TOXIC_FOODS };

/** Every known food. Toxic entries come first, so they win any tie. */
export const FOOD_CATALOG: readonly IngredientDefinition[] = [...TOXIC_FOODS, ...CAUTION_FOODS, ...SAFE_FOODS];

/** Common household items offered as quick-tap chips in the pantry selector, in display order. */
export const PANTRY_ITEM_IDS = [
  'white-rice',
  'chicken-breast',
  'egg',
  'cottage',
  'turkey-breast',
  'potato',
  'sweet-potato',
  'pumpkin',
  'carrot',
  'tuna',
  'apple',
  'bread',
  'onion',
  'garlic',
  'grapes',
  'chocolate',
] as const;

/** The catalog entry with this id, if any. */
export function findIngredient(id: string): IngredientDefinition | undefined {
  return FOOD_CATALOG.find((entry) => entry.id === id);
}
