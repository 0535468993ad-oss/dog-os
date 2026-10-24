// WCAG 2.1 AA for every foreground/background pairing the UI relies on. A palette change that breaks a
// pairing fails here, with the pair and its ratio in the test name – add the pair when introducing one.
import { colors, palette, type ColorToken } from '@/constants/theme';
import { AA, contrastRatio, relativeLuminance } from '@/utils/contrast';

type Pair = [fg: ColorToken, bg: ColorToken, usage: string];

const TEXT_PAIRS: Pair[] = [
  ['textPrimary', 'background', 'body text on the canvas'],
  ['textPrimary', 'surface', 'body text on cards and inputs'],
  ['textPrimary', 'surfaceAlt', 'body text on alt surfaces'],
  ['textPrimary', 'aiMuted', 'advisor message text'],
  ['textPrimary', 'primarySoft', 'text on primary-tone cards'],
  ['textPrimary', 'heroNavy', 'hero title'],
  ['textSecondary', 'background', 'secondary text on the canvas'],
  ['textSecondary', 'surface', 'secondary text on cards'],
  ['textSecondary', 'surfaceAlt', 'neutral badges'],
  ['textSecondary', 'aiMuted', 'message timestamps'],
  ['textSecondary', 'primarySoft', 'captions on primary-tone cards'],
  ['textSecondary', 'heroNavy', 'hero captions'],
  ['textOnDarkSecondary', 'heroNavy', 'hero caption'],
  ['primary', 'surface', 'links, outline buttons'],
  ['primary', 'background', 'links on the canvas'],
  ['primary', 'primaryMuted', 'tonal buttons, primary badges'],
  ['onPrimary', 'primary', 'filled buttons, user bubbles'],
  ['onPrimary', 'primaryPressed', 'pressed filled buttons'],
  ['primaryBright', 'heroNavy', 'highlight text on the hero'],
  ['healthText', 'surface', 'health text'],
  ['healthText', 'healthMuted', 'health prompt chips'],
  ['alertText', 'surface', 'alert text'],
  ['alertText', 'alertMuted', 'toxicity prompt chips'],
  ['ai', 'surface', 'AI accents as text'],
  ['ai', 'aiMuted', 'general prompt chips, advisor label'],
  ['onPrimary', 'ai', 'text on indigo fills'],
  ['danger', 'surface', 'error text and boundaries'],
  ['danger', 'background', 'error text on the canvas'],
  ['dangerText', 'dangerMuted', 'danger badges, toasts, important insights'],
  ['dangerText', 'surface', 'field errors'],
  ['success', 'successMuted', 'success badges'],
  ['warning', 'warningMuted', 'warning badges'],
  ['info', 'infoMuted', 'info badges, disclaimers'],
  ['secondary', 'secondaryMuted', 'secondary-tone content'],
  ['accentMint', 'surface', 'safe-food labels'],
  ['accentMint', 'surfaceAlt', 'marker cues on the focused story step'],
  ['accentMint', 'background', 'marker cues on unfocused story steps'],
  ['accentRed', 'surface', 'toxic-food labels'],
  ['accentOrange', 'surface', 'kitchen calls to action as text'],
  ['accentCyan', 'surface', 'active indicators as text'],
  ['accentBlue', 'surface', 'primary actions as text'],
  ['warning', 'surface', 'breed-match warning headings'],
  ['success', 'surface', 'breed-match "best home" labels'],
  ['accentMint', 'successMuted', 'safe-food badge'],
  ['accentOrange', 'warningMuted', 'caution-food badge'],
  ['accentRed', 'dangerMuted', 'toxic-food badge'],
  ['textPrimary', 'successMuted', 'safe-food badge details'],
  ['textPrimary', 'warningMuted', 'caution-food badge details'],
  ['textPrimary', 'dangerMuted', 'toxic-food badge details'],
  ['onAccent', 'accentMint', 'text on mint fills'],
  ['onAccent', 'accentRed', 'text on red fills'],
  ['onAccent', 'accentOrange', 'text on orange fills'],
  ['onAccent', 'accentCyan', 'text on cyan fills'],
  ['onAccent', 'accentBlue', 'text on blue fills'],
];

// WCAG 1.4.11: icons, control boundaries and focus indicators need 3:1.
const NON_TEXT_PAIRS: Pair[] = [
  ['borderStrong', 'surface', 'input boundaries'],
  ['borderStrong', 'background', 'input boundaries on the canvas'],
  ['borderStrong', 'surfaceAlt', 'input boundaries on alt surfaces'],
  ['focus', 'surface', 'focus ring'],
  ['focus', 'background', 'focus ring on the canvas'],
  ['primaryBright', 'surface', 'accent icons'],
  ['health', 'surface', 'mint icons and chip borders'],
  ['alert', 'surface', 'orange icons and chip borders'],
  ['aiBright', 'surface', 'indigo chip borders'],
  ['aiBright', 'aiMuted', 'advisor bubble accent edge'],
  ['textMuted', 'surface', 'non-critical icons, disabled states'],
];

const HEX = /^#[0-9A-F]{6}$/i;
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
  it('uses the Dark Luxury base values', () => {
    expect(colors).toMatchObject({
      background: '#080C14',
      surfaceGlass: 'rgba(17, 24, 39, 0.75)',
      border: 'rgba(255, 255, 255, 0.08)',
      textPrimary: '#F9FAFB',
      textSecondary: '#9CA3AF',
      textMuted: '#6B7280',
      accentOrange: '#FF8A00',
      accentMint: '#00F5A0',
      accentRed: '#EF4444',
      accentCyan: '#00E5FF',
      accentBlue: '#3B82F6',
    });
  });

  it('keeps textMuted out of body text roles', () => {
    expect(ratio('textMuted', 'surface')).toBeLessThan(AA.text);
  });

  it('defines surface as the glass fill composited over the canvas', () => {
    const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const glass = [17, 24, 39];
    const composited = channels(colors.background).map((bg, i) => Math.round(0.75 * (glass[i] ?? 0) + 0.25 * bg));
    expect(channels(colors.surface)).toEqual(composited);
  });

  it('keeps every opaque swatch a #RRGGBB value the contrast math can check', () => {
    const translucent = new Set<string>([palette.glass, palette.glassBorder, colors.overlay]);
    for (const value of Object.values(colors)) {
      if (!translucent.has(value)) expect(value).toMatch(HEX);
    }
  });

  it('computes the reference ratios from the WCAG definition', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(() => relativeLuminance('red')).toThrow();
  });
});
