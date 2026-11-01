// Obsidian brand design system – the single source of truth for color, blur, spacing, radius, type and
// elevation. Obsidian canvas, dark glass cards, Tactical Amber as the brand with gold and metallic bronze
// accents, Emerald Sage for health and Warm Indigo for AI. No cool cyan or mint: every accent stays warm.
// Every text and control pairing the UI relies on is asserted (WCAG 2.1 AA) in src/constants/__tests__/theme.test.ts.
import type { TextStyle, ViewStyle } from 'react-native';

/** Raw swatches. Components use the semantic `colors` below, never these directly. */
export const palette = {
  obsidian950: '#080A0F', // canvas
  obsidian925: '#0D111A', // recessed tracks (segmented controls)
  obsidian900: '#121620', // card surface: the glass fill composited over the canvas
  obsidian850: '#181E2C', // recessed inputs
  obsidianHero: '#151B28',
  glass: 'rgba(21, 26, 38, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.07)',
  barGlass: 'rgba(18, 22, 32, 0.88)', // tab bar fill: labels keep ≥ 4.5:1 even over pure white content

  gray50: '#F9FAFB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  slate400: '#8E9BAE',
  slate300: '#CBD5E1',

  amber500: '#F59E0B',
  amber400: '#FBBF24',
  amber600: '#D97706',
  amberTint: '#2A1F0A',
  amberSoft: '#1A1509',
  emerald500: '#10B981',
  emerald400: '#34D399',
  emeraldTint: '#0A2A20',
  gold300: '#FCD34D', // XP and rewards
  bronze300: '#D9A86C', // metallic accent: active indicators, quest borders
  champagne: '#F3E3C3', // focus ring: light enough to read next to amber fills
  slateTint: '#1A2130', // info and disclaimer fill
  orange: '#FB923C',
  orangeTint: '#2B1B07',
  red500: '#EF4444',
  red400: '#F87171',
  redTint: '#2A1012',
  indigo400: '#818CF8',
  indigo300: '#A5B4FC',
  indigoTint: '#1A1C3D',
} as const;

export const colors = {
  // Canvas
  background: palette.obsidian950,
  /** Opaque card fill (what the glass looks like over the canvas). Use for nested cards and chips. */
  surface: palette.obsidian900,
  /** Translucent glass fill for GlassCard; only over the canvas, where it composites to `surface`. */
  surfaceGlass: palette.glass,
  /** Translucent tab bar fill over the blur; content of any brightness may scroll beneath it. */
  surfaceBar: palette.barGlass,
  /** Level 2: recessed inputs and neutral badges. */
  surfaceAlt: palette.obsidian850,
  /** Deepest level: the track segmented controls sit in. */
  surfaceSunken: palette.obsidian925,
  heroSurface: palette.obsidianHero,

  // Text
  textPrimary: palette.gray50, // headers and primary labels
  textSecondary: palette.gray400, // secondary text on every surface
  textMuted: palette.gray500, // non-critical icons and disabled states only, never body text
  /** Quiet labels and metadata: quieter than body text, still ≥ 4.5:1. */
  textLabel: palette.slate400,
  /** Inactive tab bar icons and labels: bright enough to find at a glance over the bar glass. */
  tabInactive: palette.gray300,
  textOnDark: palette.gray50,
  textOnDarkSecondary: palette.gray300,

  // Accents (warm only)
  accentBronze: palette.bronze300, // status toggles, active indicators, quest borders
  accentOrange: palette.orange, // kitchen and feeding calls to action
  accentGold: palette.gold300, // XP, rewards and completed steps
  accentRed: palette.red500, // toxic warnings, emergency alerts
  /** Text and icons on any accent fill: dark text keeps every accent ≥ 5:1. */
  onAccent: palette.obsidian950,

  // Brand: Tactical Amber. Fills use primary; text and icons on dark use primaryBright.
  primary: palette.amber500,
  primaryPressed: palette.amber400,
  primaryBright: palette.amber400,
  primaryMuted: palette.amberTint, // tonal buttons and badges
  primarySoft: palette.amberSoft, // primary-tone cards
  onPrimary: palette.obsidian950,

  secondary: palette.emerald400,
  secondaryMuted: palette.emeraldTint,

  // Emerald Sage: health and bio data
  health: palette.emerald500,
  healthBright: palette.emerald400,
  healthText: palette.emerald400,
  healthMuted: palette.emeraldTint,

  // Orange, not amber: warnings must stay distinguishable from the brand color.
  alert: palette.orange,
  alertText: palette.orange,
  alertMuted: palette.orangeTint,

  // Warm Indigo: AI and intelligence
  ai: palette.indigo400,
  aiBright: palette.indigo300,
  aiMuted: palette.indigoTint,

  border: palette.glassBorder, // decorative separators only (below 3:1 by design)
  borderStrong: palette.gray500, // input and control boundaries: ≥ 3:1 on every surface
  focus: palette.champagne, // near-white, so the ring stays visible around amber fills

  danger: palette.red500, // error boundaries and text
  dangerText: palette.red400,
  dangerMuted: palette.redTint,
  success: palette.emerald400,
  successMuted: palette.emeraldTint,
  warning: palette.orange,
  warningMuted: palette.orangeTint,
  info: palette.slate300,
  infoMuted: palette.slateTint,

  // League podium places
  medalGold: palette.amber400,
  medalSilver: palette.slate300,
  medalBronze: palette.amber600,

  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Translucent tints of the accents, always laid over `surface` (theme.test.ts checks their content
 * composited over it). 12% fills sit behind icons; the highlight marks the user's own row.
 */
export const tints = {
  primary: 'rgba(245, 158, 11, 0.12)',
  health: 'rgba(16, 185, 129, 0.12)',
  ai: 'rgba(129, 140, 248, 0.12)',
  alert: 'rgba(251, 146, 60, 0.12)',
  danger: 'rgba(239, 68, 68, 0.12)',
  info: 'rgba(142, 155, 174, 0.12)',
  neutral: 'rgba(255, 255, 255, 0.06)',
  primaryHighlight: 'rgba(245, 158, 11, 0.14)',
  primaryHighlightBorder: 'rgba(245, 158, 11, 0.4)',
  medalGold: 'rgba(251, 191, 36, 0.14)',
  medalSilver: 'rgba(203, 213, 225, 0.12)',
  medalBronze: 'rgba(217, 119, 6, 0.16)',
} as const;

export type TintToken = keyof typeof tints;

/** Default blur strength for glass surfaces (expo-blur intensity, 1–100). */
export const blurIntensity = 40;

/** Blur strength for system bars (the tab bar), heavier than cards so content beneath stays abstract. */
export const barBlurIntensity = 80;

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
  extrabold: 'Heebo_800ExtraBold',
} as const;

export type TypographyVariant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'section';

// A ~1.25 modular scale. Headings use bold/semibold so hierarchy reads from weight and size together.
// `title` is the screen hero title; `section` heads a group below it: bold and bright, so it outranks the
// group's own action buttons. Body and caption get Hebrew-friendly leading (~1.6) for multi-line copy.
// Tracking and leading follow size, as optical sizing does: large type tightens (about -0.02em, leading
// ~1.2) because its letters read too far apart as they grow; body stays at 0, and the 10pt tab label opens slightly.
export const typography: Record<TypographyVariant, TextStyle> = {
  display: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 26, letterSpacing: -0.2 },
  subheading: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 26 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  section: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 26 },
};

/** Fixed-width digits for metrics (weight, XP, places), so changing numbers don't shift their row. */
export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

// iOS HIG tab bar label: 10 pt medium. Not part of the AppText scale; font scaling stays uncapped.
export const tabBarLabel: TextStyle = { fontFamily: fonts.medium, fontSize: 10, lineHeight: 12, letterSpacing: 0.1 };

// Elevation on a dark canvas: black shadows need real opacity to read.
export const shadow = {
  sm: { shadowColor: colors.shadow, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  card: { shadowColor: colors.shadow, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  raised: { shadowColor: colors.shadow, shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
} as const satisfies Record<string, ViewStyle>;

// Minimum touch target (WCAG 2.5.5 / platform guidelines).
export const MIN_TOUCH_AREA = 44;

/** A soft colored glow behind text (text shadows; works on every platform). */
export function textGlow(color: string): TextStyle {
  return { textShadowColor: color, textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } };
}

/** A colored glow (iOS shadow / Android elevation) for vivid accent elements. */
export function glow(color: string): ViewStyle {
  return { shadowColor: color, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 };
}
