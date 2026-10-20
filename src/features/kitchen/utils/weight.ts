/** Parses a typed weight in kg ("12", "12.5", "12,5"); null when empty or not a positive number. */
export function parseWeightKg(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value > 0 ? value : null;
}

/** A stored weight as the text field shows it. */
export function formatWeightKg(weightKg: number | null | undefined): string {
  return weightKg != null && weightKg > 0 ? String(weightKg) : '';
}
