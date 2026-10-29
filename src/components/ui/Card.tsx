import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadow, spacing } from '@/constants/theme';

import { PressableScale } from '../motion';

type CardTone = 'default' | 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  /**
   * Required when onPress is set: describes where the card leads. On a static card it groups the content
   * into one screen-reader element read with this label (e.g. a stat tile: "3 ימי רצף").
   */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  tone?: CardTone;
  /** Lifts the card a level higher, for the one hero card on a screen. */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Tones keep the clean obsidian surface and carry their color in a start-edge accent bar (right in RTL)
// instead of a full tinted fill. Only danger keeps a tinted fill, so emergencies still stand out.
const TONES: Record<CardTone, { bg: string; accent: string | null }> = {
  default: { bg: colors.surface, accent: null },
  primary: { bg: colors.surface, accent: colors.primary },
  secondary: { bg: colors.surface, accent: colors.secondary },
  danger: { bg: colors.dangerMuted, accent: colors.danger },
  warning: { bg: colors.surface, accent: colors.warning },
  success: { bg: colors.surface, accent: colors.success },
  info: { bg: colors.surface, accent: colors.info },
};

/** The fill and accent-bar style for a card tone. */
function cardToneStyle(tone: CardTone): ViewStyle {
  const { bg, accent } = TONES[tone];
  return accent ? { backgroundColor: bg, borderColor: colors.border, borderStartWidth: 3, borderStartColor: accent } : { backgroundColor: bg, borderColor: colors.border };
}

/** Rounded surface for grouped content; pressable (with spring feedback) when onPress is set. */
export function Card({ children, onPress, accessibilityLabel, accessibilityHint, tone = 'default', elevated, style }: CardProps) {
  const cardStyle = [styles.card, elevated && styles.elevated, cardToneStyle(tone), style];

  if (!onPress) {
    return (
      <View style={cardStyle} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel}>
        {children}
      </View>
    );
  }

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} style={cardStyle}>
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  elevated: {
    ...shadow.raised,
  },
});
