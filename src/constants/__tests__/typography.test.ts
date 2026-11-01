import { tabBarLabel, typography, type TypographyVariant } from '../theme';

const variants = Object.keys(typography) as TypographyVariant[];

function size(variant: TypographyVariant): number {
  return typography[variant].fontSize ?? 0;
}

describe('typography scale', () => {
  it('tightens tracking on large text and never loosens anything above body size', () => {
    for (const variant of variants) {
      const tracking = typography[variant].letterSpacing ?? 0;
      if (size(variant) >= 24) expect(tracking).toBeLessThan(0);
      if (size(variant) > 16) expect(tracking).toBeLessThanOrEqual(0);
    }
  });

  it('keeps body copy at neutral tracking', () => {
    expect(typography.body.letterSpacing ?? 0).toBe(0);
    expect(typography.bodyStrong.letterSpacing ?? 0).toBe(0);
  });

  it('gives large text tighter leading than body, without clipping (≥ 1.15)', () => {
    const ratio = (variant: TypographyVariant) => (typography[variant].lineHeight ?? 0) / size(variant);
    for (const variant of ['display', 'title'] as const) {
      expect(ratio(variant)).toBeLessThan(ratio('body'));
      expect(ratio(variant)).toBeGreaterThanOrEqual(1.15);
    }
  });

  it('opens the tiny tab bar label slightly for legibility', () => {
    expect(tabBarLabel.letterSpacing ?? 0).toBeGreaterThan(0);
  });
});
