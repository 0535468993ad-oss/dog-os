// WCAG 2.1 AA for every Dark Luxury foreground/background pairing the UI relies on. A palette change that
// breaks a pairing fails here, with the pair and its ratio in the test name.
import { darkColors, type DarkColorToken } from '@/constants/theme';
import { AA, contrastRatio } from '@/theme/contrast';

type Pair = [fg: DarkColorToken, bg: DarkColorToken, usage: string];

const TEXT_PAIRS: Pair[] = [
  ['textPrimary', 'background', 'body text on the canvas'],
  ['textPrimary', 'surfaceSolid', 'body text on cards and inputs'],
  ['textSecondary', 'background', 'labels and captions on the canvas'],
  ['textSecondary', 'surfaceSolid', 'placeholders and captions on cards'],
  ['danger', 'background', 'error text on the canvas'],
  ['danger', 'surfaceSolid', 'error text on cards'],
  ['cyan', 'surfaceSolid', 'cyan accent text'],
  ['electricBlue', 'surfaceSolid', 'blue accent text'],
  ['warmOrange', 'surfaceSolid', 'orange accent text'],
  ['mintGreen', 'surfaceSolid', 'mint accent text'],
  ['onAccent', 'cyan', 'selected calendar day, cyan buttons'],
  ['onAccent', 'electricBlue', 'text on blue fills'],
  ['onAccent', 'warmOrange', 'text on orange fills'],
  ['onAccent', 'mintGreen', 'text on mint fills'],
];

// WCAG 1.4.11: icons, control boundaries and focus indicators need 3:1.
const NON_TEXT_PAIRS: Pair[] = [
  ['borderStrong', 'surfaceSolid', 'input boundaries on cards'],
  ['borderStrong', 'background', 'input boundaries on the canvas'],
  ['danger', 'surfaceSolid', 'error boundaries'],
  ['cyan', 'surfaceSolid', 'calendar icon, accent rings'],
  ['textMuted', 'surfaceSolid', 'muted icons and large text'],
];

const HEX = /^#[0-9a-f]{6}$/i;
const ratio = (fg: DarkColorToken, bg: DarkColorToken) => contrastRatio(darkColors[fg], darkColors[bg]);

describe('Dark Luxury text contrast (4.5:1)', () => {
  it.each(TEXT_PAIRS.map(([fg, bg, usage]) => [`${fg} on ${bg} (${usage}): ${ratio(fg, bg).toFixed(2)}`, fg, bg] as const))('%s', (_, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(AA.text);
  });
});

describe('Dark Luxury non-text contrast (3:1)', () => {
  it.each(NON_TEXT_PAIRS.map(([fg, bg, usage]) => [`${fg} on ${bg} (${usage}): ${ratio(fg, bg).toFixed(2)}`, fg, bg] as const))('%s', (_, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(AA.large);
  });
});

describe('Dark Luxury guard rails', () => {
  it('keeps textMuted out of body text roles', () => {
    expect(ratio('textMuted', 'surfaceSolid')).toBeLessThan(AA.text);
  });

  it('defines surfaceSolid as the glass fill composited over the canvas', () => {
    const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const glass = [17, 24, 39];
    const composited = channels(darkColors.background).map((bg, i) => Math.round(0.75 * (glass[i] ?? 0) + 0.25 * bg));
    expect(darkColors.surface).toBe('rgba(17, 24, 39, 0.75)');
    expect(channels(darkColors.surfaceSolid)).toEqual(composited);
  });

  it('keeps every opaque token a #RRGGBB value the contrast math can check', () => {
    const translucent: DarkColorToken[] = ['surface', 'border'];
    for (const [token, value] of Object.entries(darkColors)) {
      if (!translucent.includes(token as DarkColorToken)) expect(value).toMatch(HEX);
    }
  });
});
