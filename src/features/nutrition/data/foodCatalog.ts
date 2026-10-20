import type { FoodProduct } from '../types';
import { KIBBLE_FOODS } from './kibbleFoods';
import { POUCH_FOODS } from './pouchFoods';
import { SUPPLEMENTS } from './supplements';

/** Every product in the catalog: pouches, dry food, then supplements. */
export const FOOD_CATALOG: readonly FoodProduct[] = [...POUCH_FOODS, ...KIBBLE_FOODS, ...SUPPLEMENTS];

/** The catalog product with this id, if any. */
export function findProduct(id: string): FoodProduct | undefined {
  return FOOD_CATALOG.find((product) => product.id === id);
}
