import { parseWeightKg } from '@/features/health/logic/weightInput';
import type { DogSize } from '@/lib/database.types';

import type { DogInput } from '../api';
import { BREED_BY_ID } from '../breeds';

export interface DogFormValues {
  name: string;
  /** A listed breed slug, or null when the user typed a custom breed. */
  breedId: string | null;
  customBreed: string | null;
  birthDate: string | null;
  size: DogSize | null;
  weight: string;
}

export interface DogFormErrors {
  name?: string;
  breed?: string;
  birthDate?: string;
  size?: string;
  weight?: string;
}

export const MAX_NAME_LENGTH = 50;
export const MAX_CUSTOM_BREED_LENGTH = 80;

/** The breed text to store: the listed breed's label, or the custom text. */
export function breedLabelOf(breedId: string | null, customBreed: string | null): string | null {
  return breedId ? (BREED_BY_ID.get(breedId)?.label ?? null) : customBreed;
}

/** Field errors; birth date may not be in the future and weight is optional but must be valid. */
export function validateDogForm(values: DogFormValues, today: string): DogFormErrors {
  const errors: DogFormErrors = {};
  const name = values.name.trim();
  if (!name || name.length > MAX_NAME_LENGTH) errors.name = `הזינו שם (עד ${MAX_NAME_LENGTH} תווים).`;
  if (!breedLabelOf(values.breedId, values.customBreed)) errors.breed = 'בחרו גזע או ״מעורב״.';
  if (!values.birthDate) errors.birthDate = 'בחרו תאריך לידה (משוער זה בסדר).';
  else if (values.birthDate > today) errors.birthDate = 'תאריך הלידה לא יכול להיות בעתיד.';
  if (!values.size) errors.size = 'בחרו גודל.';
  if (values.weight.trim() && parseWeightKg(values.weight) === null) errors.weight = 'משקל בין 0.1 ל-149 ק״ג.';
  return errors;
}

/** The record to save, or null when the form is invalid. "mixed" is stored as text only, not as a breed slug. */
export function buildDogInput(values: DogFormValues, today: string): DogInput | null {
  const breed = breedLabelOf(values.breedId, values.customBreed);
  if (Object.keys(validateDogForm(values, today)).length || !breed || !values.birthDate || !values.size) return null;
  return {
    name: values.name.trim(),
    breed,
    breedId: values.breedId && values.breedId !== 'mixed' ? values.breedId : null,
    birthDate: values.birthDate,
    size: values.size,
    weightKg: values.weight.trim() ? parseWeightKg(values.weight) : null,
  };
}

/** After picking a breed, suggest its typical size – but never override a size the user already chose. */
export function suggestedSize(currentSize: DogSize | null, breedId: string): DogSize | null {
  return currentSize ?? BREED_BY_ID.get(breedId)?.typicalSize ?? null;
}
