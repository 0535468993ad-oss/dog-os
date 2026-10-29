// WCAG 2.1 AA for every foreground/background pairing the UI relies on. A palette change that breaks a
// pairing fails here, with the pair and its ratio in the test name – add the pair when introducing one.
import { colors, palette, tints, type ColorToken, type TintToken } from '@/constants/theme';
import { AA, contrastRatio, relativeLuminance } from '@/utils/contrast';

type Pair = [fg: ColorToken, bg: ColorToken, usage: string];

const TEXT_PAIRS: Pair[] = [
  ['textPrimary', 'background', 'body text on the canvas'],
  ['textPrimary', 'surface', 'body text on cards and inputs'],
  ['textPrimary', 'surfaceAlt', 'body text on alt surfaces'],
  ['textPrimary', 'aiMuted', 'advisor message text'],
  ['textPrimary', 'primarySoft', 'text on primary-tone cards'],
  ['textPrimary', 'heroSurface', 'hero title'],
  ['textSecondary', 'background', 'secondary text on the canvas'],
  ['textSecondary', 'surface', 'secondary text on cards'],
  ['textSecondary', 'surfaceAlt', 'neutral badges'],
  ['textSecondary', 'aiMuted', 'message timestamps'],
  ['textSecondary', 'primarySoft', 'captions on primary-tone cards'],
  ['textSecondary', 'heroSurface', 'hero captions'],
  ['textOnDarkSecondary', 'heroSurface', 'hero caption'],
  ['primary', 'surface', 'links, outline buttons'],
  ['primary', 'background', 'links on the canvas'],
  ['primary', 'primaryMuted', 'tonal buttons, primary badges'],
  ['onPrimary', 'primary', 'filled buttons, user bubbles'],
  ['onPrimary', 'primaryPressed', 'pressed filled buttons'],
  ['primaryBright', 'heroSurface', 'highlight text on the hero'],
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
  ['textLabel', 'background', 'section labels on the canvas'],
  ['textLabel', 'surface', 'section labels on cards'],
  ['primaryBright', 'surface', 'amber text and active segment labels'],
  ['primaryBright', 'background', 'amber text on the canvas'],
  ['onPrimary', 'primaryBright', 'text on bright amber fills'],
  ['textPrimary', 'surfaceSunken', 'unselected segment labels'],
  ['textSecondary', 'surfaceSunken', 'unselected segment labels'],
  ['textSecondary', 'surfaceAlt', 'field placeholders and empty date fields'],
  ['primaryBright', 'primaryMuted', 'breed profile pill'],
  ['medalGold', 'surface', 'first place'],
  ['medalSilver', 'surface', 'second place'],
  ['medalBronze', 'surface', 'third place'],
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
  ['borderStrong', 'surfaceSunken', 'segmented track boundary'],
  ['primary', 'surfaceSunken', 'selected segment fill on its track'],
  ['ai', 'surface', 'AI icons'],
  ['accentCyan', 'surfaceAlt', 'calendar icon in the recessed date field'],
  ['focus', 'surfaceAlt', 'focused field boundary on the recessed surface'],
  ['danger', 'surfaceAlt', 'field error boundary on the recessed surface'],
  ['primary', 'surface', 'amber avatar ring on cards'],
];

// Translucent tints over `surface`: the content laid on them must keep its ratio after compositing.
type TintPair = [fg: ColorToken, tint: TintToken, min: number, usage: string];
const TINT_PAIRS: TintPair[] = [
  ['textPrimary', 'primaryHighlight', AA.text, 'the user row in the league'],
  ['medalGold', 'medalGold', AA.text, 'first-place badge'],
  ['medalSilver', 'medalSilver', AA.text, 'second-place badge'],
  ['medalBronze', 'medalBronze', AA.text, 'third-place badge'],
  ['primaryBright', 'primary', AA.large, 'amber icon squircles'],
  ['healthBright', 'health', AA.large, 'emerald icon squircles'],
  ['aiBright', 'ai', AA.large, 'indigo icon squircles'],
  ['alert', 'alert', AA.large, 'orange icon squircles'],
  ['dangerText', 'danger', AA.large, 'red icon squircles'],
  ['info', 'info', AA.large, 'cyan icon squircles'],
  ['textSecondary', 'neutral', AA.large, 'neutral icon squircles'],
  ['healthText', 'health', AA.text, 'health category on chip badges'],
  ['alertText', 'alert', AA.text, 'toxicity category on chip badges'],
  ['ai', 'ai', AA.text, 'general category on chip badges'],
];

/** An rgba() tint flattened onto an opaque #RRGGBB backdrop. */
function composite(rgba: string, backdrop: string): string {
  const match = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(rgba);
  if (!match) throw new Error(`not rgba(): ${rgba}`);
  const [, r, g, b, a] = match.map(Number);
  const fill = [r, g, b];
  const alpha = a ?? 1;
  return (
    '#' +
    [1, 3, 5]
      .map((i, c) => Math.round(alpha * (fill[c] ?? 0) + (1 - alpha) * parseInt(backdrop.slice(i, i + 2), 16)))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

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

describe('WCAG AA over translucent tints (composited onto surface)', () => {
  it.each(
    TINT_PAIRS.map(([fg, tint, min, usage]) => {
      const bg = composite(tints[tint], colors.surface);
      return [`${fg} on ${tint} tint (${usage}): ${contrastRatio(colors[fg], bg).toFixed(2)}`, fg, bg, min] as const;
    }),
  )('%s', (_, fg, bg, min) => {
    expect(contrastRatio(colors[fg], bg)).toBeGreaterThanOrEqual(min);
  });
});

describe('palette guard rails', () => {
  it('uses the obsidian brand base values', () => {
    expect(colors).toMatchObject({
      background: '#080A0F',
      surface: '#121620',
      surfaceAlt: '#181E2C',
      surfaceSunken: '#0D111A',
      border: 'rgba(255, 255, 255, 0.07)',
      textPrimary: '#F9FAFB',
      textSecondary: '#9CA3AF',
      textMuted: '#6B7280',
      textLabel: '#8E9BAE',
      primary: '#F59E0B',
      primaryBright: '#FBBF24',
      onPrimary: '#080A0F',
      health: '#10B981',
      healthText: '#34D399',
      ai: '#818CF8',
      accentRed: '#EF4444',
      accentCyan: '#00E5FF',
    });
    expect(tints.primaryHighlight).toBe('rgba(245, 158, 11, 0.14)');
  });

  it('has no sky-blue left in the color roles', () => {
    const values = Object.values(colors).map((value) => value.toUpperCase());
    expect(values).not.toContain('#3B82F6');
    expect(values).not.toContain('#60A5FA');
  });

  it('keeps textMuted out of body text roles', () => {
    expect(ratio('textMuted', 'surface')).toBeLessThan(AA.text);
  });

  it('defines surface as the glass fill composited over the canvas', () => {
    const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const glass = [21, 26, 38];
    const composited = channels(colors.background).map((bg, i) => Math.round(0.75 * (glass[i] ?? 0) + 0.25 * bg));
    expect(channels(colors.surface)).toEqual(composited);
  });

  it('keeps every opaque swatch a #RRGGBB value the contrast math can check', () => {
    const translucent = new Set<string>([palette.glass, palette.glassBorder, palette.barGlass, colors.overlay]);
    for (const value of Object.values(colors)) {
      if (!translucent.has(value)) expect(value).toMatch(HEX);
    }
  });

  // The tab bar floats over scrolling content, so its labels are checked over the brightest possible
  // backdrop (a white photo) as well as the canvas, with the bar fill composited on top.
  it.each([
    ['pure white content', '#FFFFFF'],
    ['the canvas', colors.background],
  ])('keeps tab bar labels at 4.5:1 over %s', (_, backdrop) => {
    const match = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(colors.surfaceBar);
    if (!match) throw new Error(`surfaceBar is not rgba(): ${colors.surfaceBar}`);
    const [, r, g, b, a] = match.map(Number);
    const fill = [r, g, b];
    const alpha = a ?? 1;
    const composite =
      '#' +
      [1, 3, 5]
        .map((i, c) => Math.round(alpha * (fill[c] ?? 0) + (1 - alpha) * parseInt(backdrop.slice(i, i + 2), 16)))
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('');
    expect(contrastRatio(colors.textSecondary, composite)).toBeGreaterThanOrEqual(AA.text);
    expect(contrastRatio(colors.primaryBright, composite)).toBeGreaterThanOrEqual(AA.text);
  });

  it('computes the reference ratios from the WCAG definition', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(() => relativeLuminance('red')).toThrow();
  });
});
