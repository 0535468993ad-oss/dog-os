export const colors = {
  primary: '#E07A2F',
  primaryMuted: '#FBE9DC',
  background: '#F7F5F2',
  surface: '#FFFFFF',
  textPrimary: '#1F1B16',
  textSecondary: '#6B645C',
  border: '#E6E1DA',
  success: '#2E9E5B',
  danger: '#D64545',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
