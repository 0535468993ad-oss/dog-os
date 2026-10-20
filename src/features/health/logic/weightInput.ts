/** Valid range for a dog's weight in kg (matches the database check constraint). */
export const WEIGHT_RANGE = { min: 0, max: 150 } as const;

export const WEIGHT_RANGE_ERROR = 'הזינו משקל בין 0.1 ל-149 ק״ג.';

/** Parses a typed weight (accepts a decimal comma); null when it isn't a valid weight. */
export function parseWeightKg(input: string): number | null {
  const kg = Number(input.trim().replace(',', '.'));
  if (!input.trim() || !Number.isFinite(kg) || kg <= WEIGHT_RANGE.min || kg >= WEIGHT_RANGE.max) return null;
  return kg;
}
