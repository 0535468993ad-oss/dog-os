// Dark Luxury design system – the single source of truth for color, blur, spacing, radius, type and
// elevation. Deep navy-black canvas, dark glass cards and five vivid accents. Every text and control
// pairing the UI relies on is asserted (WCAG 2.1 AA) in src/constants/__tests__/theme.test.ts.
import type { TextStyle, ViewStyle } from 'react-native';

/** Raw swatches. Components use the semantic `colors` below, never these directly. */
export const palette = {
  navy950: '#080C14', // canvas
  navy900: '#0F1522', // glass fill composited over the canvas
  navy850: '#161E2E',
  heroNavy: '#0F1B34',
  glass: 'rgba(17, 24, 39, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  gray50: '#F9FAFB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',

  blue500: '#3B82F6',
  blue400: '#60A5FA',
  blueTint: '#0F1C35',
  blueSoft: '#0E1830',
  cyan: '#00E5FF',
  cyanTint: '#062A33',
  orange: '#FF8A00',
  orangeTint: '#2B1B07',
  mint: '#00F5A0',
  mintTint: '#06291F',
  red500: '#EF4444',
  red400: '#F87171',
  redTint: '#2A1012',
  indigo400: '#818CF8',
  indigo300: '#A5B4FC',
  indigoTint: '#1A1C3D',
} as const;

export const colors = {
  // Canvas
  background: palette.navy950,
  /** Opaque card fill (what the glass looks like over the canvas). Use for controls and nested cards. */
  surface: palette.navy900,
  /** Translucent glass fill for GlassCard; only over the canvas, where it composites to `surface`. */
  surfaceGlass: palette.glass,
  surfaceAlt: palette.navy850,
  heroNavy: palette.heroNavy,

  // Text
  textPrimary: palette.gray50, // headers and primary labels: 17.5:1 on surface
  textSecondary: palette.gray400, // 7.7:1 on the canvas, 7.2:1 on surface
  textMuted: palette.gray500, // 3.8:1 – non-critical icons and disabled states only, never body text
  textOnDark: palette.gray50,
  textOnDarkSecondary: palette.gray300,

  // Accents (Dark Luxury roles)
  accentBlue: palette.blue500, // primary action buttons
  accentCyan: palette.cyan, // status toggles, active indicators, focus
  accentOrange: palette.orange, // kitchen and feeding calls to action
  accentMint: palette.mint, // safe food, confirmations
  accentRed: palette.red500, // toxic warnings, emergency alerts
  /** Text and icons on any accent fill: dark text keeps every accent ≥ 5:1 (white on blue is only 3.7:1). */
  onAccent: palette.navy950,

  // Brand roles used across the app
  primary: palette.blue500, // links, filled buttons: 5.0:1 on surface
  primaryPressed: palette.blue400,
  primaryBright: palette.blue400, // icons and highlight text on heroNavy (6.7:1)
  primaryMuted: palette.blueTint, // tonal buttons and badges: primary text 4.6:1
  primarySoft: palette.blueSoft,
  onPrimary: palette.navy950,

  secondary: palette.mint,
  secondaryMuted: palette.mintTint,

  health: palette.mint,
  healthBright: palette.mint,
  healthText: palette.mint,
  healthMuted: palette.mintTint,

  alert: palette.orange,
  alertText: palette.orange,
  alertMuted: palette.orangeTint,

  ai: palette.indigo400, // 6.1:1 on surface, 5.5:1 on aiMuted
  aiBright: palette.indigo300,
  aiMuted: palette.indigoTint,

  border: palette.glassBorder, // decorative separators only (below 3:1 by design)
  borderStrong: palette.gray500, // input and control boundaries: 3.8:1 on surface
  focus: palette.cyan,

  danger: palette.red500, // error boundaries and text: 4.8:1 on surface
  dangerText: palette.red400, // 6.4:1 on dangerMuted
  dangerMuted: palette.redTint,
  success: palette.mint,
  successMuted: palette.mintTint,
  warning: palette.orange,
  warningMuted: palette.orangeTint,
  info: palette.cyan,
  infoMuted: palette.cyanTint,

  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ColorToken = keyof typeof colors;

/** Default blur strength for glass surfaces (expo-blur intensity, 1–100). */
export const blurIntensity = 40;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

// Heebo covers Hebrew and Latin. Android can't synthesize weights for custom fonts, so each weight is
// its own family instead of using fontWeight.
export const fonts = {
  regular: 'Heebo_400Regular',
  medium: 'Heebo_500Medium',
  semibold: 'Heebo_600SemiBold',
  bold: 'Heebo_700Bold',
} as const;

export type TypographyVariant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyStrong' | 'caption' | 'label';

// A ~1.25 modular scale. Headings use bold/semibold so hierarchy reads from weight and size together.
export const typography: Record<TypographyVariant, TextStyle> = {
  display: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 40 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 34 },
  heading: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 26 },
  subheading: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
};

// Elevation on a dark canvas: black shadows need more opacity than navy-tinted ones did on light.
export const shadow = {
  sm: { shadowColor: colors.shadow, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  card: { shadowColor: colors.shadow, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  raised: { shadowColor: colors.shadow, shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
} as const satisfies Record<string, ViewStyle>;

// Minimum touch target (WCAG 2.5.5 / platform guidelines).
export const MIN_TOUCH_AREA = 44;

/** A colored glow (iOS shadow / Android elevation) for vivid accent elements such as prompt chips. */
export function glow(color: string): ViewStyle {
  return { shadowColor: color, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 };
}
