// Hebrew quantities for portions. Both units used here (שקית, כוס) are feminine nouns.

export interface UnitNames {
  one: string;
  many: string;
}

// Construct forms: "רבע שקית", "שלושה רבעי שקית".
const FRACTIONS: Record<number, string> = { 0.25: 'רבע', 0.5: 'חצי', 0.75: 'שלושה רבעי' };

/** Rounds to the nearest half. */
export function toHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/** "חצי שקית", "שקית אחת", "שקית וחצי", "2 שקיות", "1.6 כוסות" – words for quarters, digits otherwise. */
export function unitsHe(value: number, unit: UnitNames): string {
  const whole = Math.floor(value);
  const fraction = Math.round((value - whole) * 100) / 100;
  const fractionWord = FRACTIONS[fraction];

  if (whole === 0 && fractionWord) return `${fractionWord} ${unit.one}`;
  if (whole === 1 && fraction === 0) return `${unit.one} אחת`;
  if (whole === 1 && fractionWord && fraction !== 0.75) return `${unit.one} ו${fractionWord}`;
  return `${Number(value.toFixed(2))} ${unit.many}`;
}

/** Grams rounded to 5, written "~350 גרם". */
export function approxGramsHe(grams: number): string {
  return `~${Math.round(grams / 5) * 5} גרם`;
}

/** A number with thousands separators, e.g. 4,460. */
export function numberHe(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export const POUCH_NAMES: UnitNames = { one: 'שקית', many: 'שקיות' };
export const CUP_NAMES: UnitNames = { one: 'כוס', many: 'כוסות' };
