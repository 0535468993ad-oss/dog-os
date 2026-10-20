import { useMemo, useState } from 'react';

import type { FoodSafetyResult } from '../types';
import { generateEmergencyPortion } from '../utils/recipeEngine';
import { checkFoodSafety, validatePantryList } from '../utils/safety';
import { useDogWeight } from './useDogWeight';

/** Emergency-kitchen state: the free-text safety lookup, the selected pantry, and the resulting meal plan. */
export function useEmergencyKitchen() {
  const weight = useDogWeight();
  const [query, setQuery] = useState('');
  const [pantryIds, setPantryIds] = useState<string[]>([]);

  const lookup: FoodSafetyResult | null = useMemo(() => (query.trim() ? checkFoodSafety(query) : null), [query]);
  const pantry = useMemo(() => validatePantryList(pantryIds), [pantryIds]);
  // No plan without a weight: the portions only make sense for a real dog.
  const plan = useMemo(() => (weight.weightKg == null ? null : generateEmergencyPortion(weight.weightKg, pantry.safe)), [weight.weightKg, pantry.safe]);

  return { weight, query, setQuery, lookup, pantryIds, setPantryIds, pantry, plan };
}
