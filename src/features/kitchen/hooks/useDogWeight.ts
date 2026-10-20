import { useState } from 'react';

import { useActiveDog } from '@/features/dogs/hooks';

import { formatWeightKg, parseWeightKg } from '../utils/weight';

/**
 * The weight the portions are sized for: the active dog's stored weight until the user types another
 * one (e.g. after a fresh weigh-in). Nothing typed here is saved.
 */
export function useDogWeight() {
  const { activeDog } = useActiveDog();
  const [typed, setTyped] = useState<string | null>(null);
  const weightText = typed ?? formatWeightKg(activeDog?.weight_kg);

  return {
    dogName: activeDog?.name ?? null,
    weightText,
    weightKg: parseWeightKg(weightText),
    setWeightText: setTyped,
  };
}
