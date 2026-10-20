// WCAG 2.1 AA for every foreground/background pairing the UI relies on. A palette change that breaks a
// pairing fails here, with the pair and its ratio in the test name.
import { colors, type ColorToken } from '@/theme';
import { AA, contrastRatio, relativeLuminance } from '@/theme/contrast';

type Pair = [fg: ColorToken, bg: ColorToken, usage: string];

const TEXT_PAIRS: Pair[] = [
  ['textPrimary', 'background', 'body text on the canvas'],
  ['textPrimary', 'surface', 'body text on cards'],
  ['textPrimary', 'surfaceAlt', 'body text on alt surfaces'],
  ['textPrimary', 'aiMuted', 'advisor message text'],
  ['textPrimary', 'primarySoft', 'text on primary-tone cards'],
  ['textSecondary', 'background', 'secondary text on the canvas'],
  ['textSecondary', 'surface', 'secondary text on cards'],
  ['textSecondary', 'surfaceAlt', 'neutral badges'],
  ['textSecondary', 'aiMuted', 'message timestamps'],
  ['textSecondary', 'primarySoft', 'captions on primary-tone cards'],
  ['primary', 'surface', 'links, outline buttons'],
  ['primary', 'background', 'links on the canvas'],
  ['primary', 'primaryMuted', 'tonal buttons, primary badges'],
  ['onPrimary', 'primary', 'filled buttons, user bubbles'],
  ['onPrimary', 'primaryPressed', 'pressed filled buttons'],
  ['healthText', 'surface', 'health text'],
  ['healthText', 'healthMuted', 'health prompt chips, icons on tint'],
  ['alertText', 'surface', 'alert text'],
  ['alertText', 'alertMuted', 'toxicity prompt chips, icons on tint'],
  ['textPrimary', 'health', 'emerald alert badges'],
  ['textPrimary', 'alert', 'coral alert badges'],
  ['ai', 'surface', 'AI accents as text'],
  ['ai', 'aiMuted', 'general prompt chips, advisor label'],
  ['onPrimary', 'ai', 'white text on indigo fills'],
  ['danger', 'surface', 'error text and boundaries'],
  ['dangerText', 'dangerMuted', 'danger badges, important insights'],
  ['success', 'successMuted', 'success badges'],
  ['warning', 'warningMuted', 'warning badges'],
  ['info', 'infoMuted', 'info badges, disclaimers'],
  ['secondary', 'secondaryMuted', 'secondary-tone content'],
  ['textOnDark', 'heroNavy', 'hero title'],
  ['textOnDarkSecondary', 'heroNavy', 'hero caption'],
  ['textMuted', 'heroNavy', 'muted text on the hero'],
  ['primaryBright', 'heroNavy', 'amber highlight text on the hero'],
  ['healthBright', 'heroNavy', 'emerald text on the hero'],
];

// WCAG 1.4.11: icons, control boundaries and focus indicators need 3:1.
const NON_TEXT_PAIRS: Pair[] = [
  ['borderStrong', 'surface', 'input boundaries'],
  ['borderStrong', 'background', 'input boundaries on the canvas'],
  ['focus', 'surface', 'focus ring'],
  ['primaryBright', 'surface', 'amber icons and accents'],
  ['health', 'surface', 'emerald icons and chip borders'],
  ['alert', 'surface', 'coral icons and chip borders'],
  ['aiBright', 'surface', 'indigo chip borders'],
  ['aiBright', 'aiMuted', 'advisor bubble accent edge'],
];

const ratio = (fg: ColorToken, bg: ColorToken) => contrastRatio(colors[fg], colors[bg]);

describe('WCAG AA text contrast (4.5:1)', () => {
  it.each(TEXT_PAIRS.map(([fg, bg, usage]) => [`${fg} on ${bg} (${usage}): ${ratio(fg, bg).toFixed(2)}`, fg, bg] as const))('%s', (_, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(AA.text);
  });
});

describe('WCAG AA non-text contrast (3:1)', () => {
  it.each(NON_TEXT_PAIRS.map(([fg, bg, usage]) => [`${fg} on ${bg} (${usage}): ${ratio(fg, bg).toFixed(2)}`, fg, bg] as const))('%s', (_, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(AA.large);
  });
});

describe('palette guard rails', () => {
  it('keeps the vivid accents unsafe for light-surface text, so they stay out of text roles', () => {
    // Documents why primaryBright / health / alert / textMuted have separate text shades.
    for (const token of ['primaryBright', 'health', 'alert', 'textMuted'] as const) {
      expect(ratio(token, 'surface')).toBeLessThan(AA.text);
    }
  });

  it('computes the reference ratios from the WCAG definition', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(() => relativeLuminance('red')).toThrow();
  });
});
