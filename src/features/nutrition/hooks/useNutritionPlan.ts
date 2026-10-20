import { useState } from 'react';

import { useActiveDog } from '@/features/dogs/hooks';

import { findProduct } from '../data/foodCatalog';
import type { ActivityLevel, FoodProduct } from '../types';
import { breedAdviceFor } from '../utils/breedAdvisor';
import { buildNutritionPlan } from '../utils/nutritionEngine';
import { nutritionProfileOf, parseLabelKcal } from '../utils/profile';

/** Without a breed-specific pick, the plan opens on a complete large-breed kibble with published values. */
const FALLBACK_PRODUCT_ID = 'royal-canin-maxi-adult';

/** The active dog's nutrition plan: activity, chosen product, kcal typed from a pack, and the computed plan. */
export function useNutritionPlan() {
  const { activeDog, isLoading } = useActiveDog();
  const [activity, setActivity] = useState<ActivityLevel>('normal');
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [labelKcalText, setLabelKcalText] = useState('');

  const profile = activeDog ? nutritionProfileOf(activeDog, activity) : null;
  const advice = profile ? breedAdviceFor(profile) : null;
  // The first recommended food (not a supplement) is the starting point.
  const defaultId = advice?.recommendedProductIds.find((id) => findProduct(id)?.category !== 'SUPPLEMENT') ?? FALLBACK_PRODUCT_ID;
  const product: FoodProduct | undefined = findProduct(chosenId ?? defaultId);

  const labelKcal = parseLabelKcal(labelKcalText);
  // Cheap and pure: recomputed on every render rather than memoized on a freshly built profile object.
  const plan = profile && product ? buildNutritionPlan(profile, product, { labelKcalPer100g: labelKcal }) : null;

  /** Switches product; a kcal value typed for the previous pack no longer applies. */
  const chooseProduct = (id: string) => {
    setChosenId(id);
    setLabelKcalText('');
  };

  return { activeDog, isLoading, profile, advice, product, plan, activity, setActivity, labelKcalText, setLabelKcalText, chooseProduct };
}
