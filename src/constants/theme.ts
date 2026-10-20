// "Dark Luxury" design system: deep navy-black canvas, dark glass cards and four vivid accents.
// Screens are migrating to it from the light "Vibrant Canvas" theme in src/theme; until a screen is
// migrated, dark components carry their own dark container so their text contrast never depends on the
// (light) surface behind them. Every pairing below is asserted in src/constants/__tests__/theme.test.ts.

/** Accent hues. Vivid on the dark canvas; never use them as text on light surfaces. */
export const darkAccents = {
  cyan: '#00E5FF',
  electricBlue: '#3B82F6',
  warmOrange: '#FF8A00',
  mintGreen: '#00F5A0',
} as const;

export const darkColors = {
  background: '#080C14',
  /** Glass card fill: translucent over the canvas (with blur behind it where the platform supports it). */
  surface: 'rgba(17, 24, 39, 0.75)',
  /** The glass fill composited over `background`: for opaque controls and platforms without blur. */
  surfaceSolid: '#0F1522',
  /** Decorative hairlines on glass only (below 3:1 by design). */
  border: 'rgba(255, 255, 255, 0.08)',
  /** Input and control boundaries (WCAG 1.4.11): 3.8:1 on surfaceSolid. */
  borderStrong: '#6B7280',

  textPrimary: '#F9FAFB', // 17.5:1 on surfaceSolid
  textSecondary: '#9CA3AF', // 7.2:1 on surfaceSolid
  textMuted: '#6B7280', // 3.8:1 – large text, icons and placeholders only, never body text

  ...darkAccents,
  /** Text and icons placed on an accent fill (e.g. the selected day in a calendar). */
  onAccent: '#080C14',
  /** Error text and boundaries: 6.6:1 on surfaceSolid. */
  danger: '#F87171',
} as const;

export type DarkColorToken = keyof typeof darkColors;

export const darkTheme = {
  colors: darkColors,
  /** Default blur strength for glass surfaces (expo-blur intensity, 1–100). */
  blurIntensity: 40,
} as const;
