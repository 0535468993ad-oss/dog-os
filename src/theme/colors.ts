// "Vibrant Canvas" palette: warm amber brand on a cool slate canvas, with one accent hue per domain –
// emerald for health/vet, coral/red for alerts, electric indigo for anything the AI engine produces.
//
// The vivid brand hues (#D97706, #059669, #10B981, #EA580C, #6366F1, #94A3B8) are below 4.5:1 on white, so
// they are used as fills, icons, borders and glows (≥ 3:1 non-text contrast) or under navy text, and each
// hue has a deeper shade of itself for small text on light surfaces. Every pairing the UI relies on is
// asserted in src/theme/__tests__/contrast.test.ts – add the pair there when introducing a new one.

/** Raw swatches. Components never use these directly; they go through the semantic `colors` below. */
export const palette = {
  amber500: '#D97706',
  amber700: '#B45309',
  amber800: '#92400E',
  amber100: '#FEF3C7',
  amber50: '#FFFBEB',

  emerald500: '#10B981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald50: '#ECFDF5',

  coral600: '#EA580C',
  coral700: '#C2410C',
  coral50: '#FFF7ED',
  red600: '#DC2626',
  red700: '#B91C1C',
  red50: '#FEF2F2',

  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo50: '#EEF2FF',

  navy: '#0F172A',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
} as const;

export const colors = {
  // Brand – warm amber
  primary: palette.amber700, // text/fills: 5.0:1 on white, 4.8:1 on background, 4.5:1 on primaryMuted
  primaryPressed: palette.amber800,
  primaryBright: palette.amber500, // accents/icons only on light (3.2:1); text-safe on heroNavy (5.6:1)
  primaryMuted: palette.amber100,
  primarySoft: palette.amber50,
  onPrimary: palette.white, // 5.0:1 on primary

  secondary: palette.emerald700,
  secondaryMuted: palette.emerald50,

  // Health & vet – emerald
  health: palette.emerald600, // badge/icon fill; pair with textPrimary (4.7:1), never with white text
  healthBright: palette.emerald500, // glows, rings, text on heroNavy (7.0:1)
  healthText: palette.emerald700, // 5.5:1 on white, 5.2:1 on healthMuted
  healthMuted: palette.emerald50,

  // Alerts – coral (seasonal hazards, warnings) and red (errors, emergencies)
  alert: palette.coral600, // badge/icon fill; pair with textPrimary (5.0:1)
  alertText: palette.coral700, // 5.2:1 on white, 4.9:1 on alertMuted
  alertMuted: palette.coral50,

  // AI engine – electric indigo
  ai: palette.indigo600, // text/fills: 6.3:1 on white, 5.6:1 on aiMuted, 6.3:1 for white text on it
  aiBright: palette.indigo500, // borders, glows, icons (4.5:1 on white)
  aiMuted: palette.indigo50,

  // Canvas
  background: palette.slate50,
  surface: palette.white,
  surfaceAlt: palette.slate100,
  heroNavy: palette.navy,

  // Text
  textPrimary: palette.navy, // 17.9:1 on white, 17.1:1 on background
  textSecondary: palette.slate600, // 7.2:1 on background, 6.9:1 on surfaceAlt
  textMuted: palette.slate400, // heroNavy surfaces only (7.0:1); 2.6:1 on white – never for light-surface text
  textOnDark: palette.white,
  textOnDarkSecondary: palette.slate300, // 12.0:1 on heroNavy

  border: palette.slate200, // decorative separators only
  borderStrong: palette.slate500, // input/control boundaries, 4.8:1 on white, 4.6:1 on background
  focus: palette.indigo600, // 6.3:1 on white

  danger: palette.red600, // 4.8:1 on white
  dangerText: palette.red700, // 5.9:1 on dangerMuted
  dangerMuted: palette.red50,
  success: palette.emerald700,
  successMuted: palette.emerald50,
  warning: palette.amber800, // 6.8:1 on warningMuted
  warningMuted: palette.amber50,
  info: palette.indigo600,
  infoMuted: palette.indigo50,

  shadow: palette.navy,
  overlay: 'rgba(15, 23, 42, 0.5)',
} as const;

export type ColorToken = keyof typeof colors;
