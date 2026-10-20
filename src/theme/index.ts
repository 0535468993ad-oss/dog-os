import type { TextStyle, ViewStyle } from 'react-native';

import { colors } from './colors';

export { colors, palette, type ColorToken } from './colors';

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

// Elevation scale. Low opacity with a navy tint and a wide radius reads as soft depth, not a drop shadow.
export const shadow = {
  sm: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  raised: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const satisfies Record<string, ViewStyle>;

// Minimum touch target (WCAG 2.5.5 / platform guidelines).
export const MIN_TOUCH_AREA = 44;

/** A colored glow (iOS shadow / Android elevation) for vivid accent elements such as prompt chips. */
export function glow(color: string): ViewStyle {
  return { shadowColor: color, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 };
}
