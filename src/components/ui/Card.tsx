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

const TONES: Record<CardTone, { bg: string; border: string }> = {
  default: { bg: colors.surface, border: colors.border },
  primary: { bg: colors.primarySoft, border: colors.primaryMuted },
  secondary: { bg: colors.secondaryMuted, border: colors.secondaryMuted },
  danger: { bg: colors.dangerMuted, border: colors.danger },
  warning: { bg: colors.warningMuted, border: colors.warningMuted },
  success: { bg: colors.successMuted, border: colors.successMuted },
  info: { bg: colors.infoMuted, border: colors.infoMuted },
};

/** Rounded surface for grouped content; pressable (with spring feedback) when onPress is set. */
export function Card({ children, onPress, accessibilityLabel, accessibilityHint, tone = 'default', elevated, style }: CardProps) {
  const toneStyle = { backgroundColor: TONES[tone].bg, borderColor: TONES[tone].border };
  const cardStyle = [styles.card, elevated && styles.elevated, toneStyle, style];

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
