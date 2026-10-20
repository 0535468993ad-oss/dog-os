export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

/** Options whose label or value contains the query (case-insensitive); all options for an empty query. */
export function filterOptions<T extends string>(options: readonly SelectOption<T>[], query: string): readonly SelectOption<T>[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
}

/** Text shown on the closed field: the selected option's label, else a custom value, else null. */
export function displayText<T extends string>(options: readonly SelectOption<T>[], value: T | null, customDisplay?: string | null): string | null {
  return options.find((option) => option.value === value)?.label ?? customDisplay ?? null;
}

/** Offer "use what I typed" when custom values are allowed and no option has exactly that label. */
export function shouldOfferCustom<T extends string>(allowCustom: boolean, query: string, matches: readonly SelectOption<T>[]): boolean {
  const text = query.trim();
  return allowCustom && text.length > 0 && !matches.some((o) => o.label === text);
}
