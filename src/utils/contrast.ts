// WCAG 2.1 contrast math (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio), used by the theme tests.

/** Relative luminance of a `#RRGGBB` color. */
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`Expected #RRGGBB, got ${hex}`);
  const value = match[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(value.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two `#RRGGBB` colors, 1..21. Order doesn't matter. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA thresholds: normal text, and large text (≥ 18.66px bold / 24px) or UI component boundaries. */
export const AA = { text: 4.5, large: 3 } as const;
