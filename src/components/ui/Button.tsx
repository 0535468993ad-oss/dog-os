import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_AREA, radius, shadow, spacing } from '@/constants/theme';

import { PressableScale } from '../motion';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'ghost' | 'danger';
type IconName = ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Overrides the visible title for screen readers when the title alone is ambiguous. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  fullWidth?: boolean;
  compact?: boolean;
}

// Each text color is verified ≥ 4.5:1 on its background (see theme).
const PALETTE: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
  primary: { bg: colors.primary, border: colors.primary, text: colors.onPrimary },
  secondary: { bg: colors.surface, border: colors.borderStrong, text: colors.textPrimary },
  tonal: { bg: colors.primaryMuted, border: colors.primaryMuted, text: colors.primary },
  ghost: { bg: 'transparent', border: 'transparent', text: colors.primary },
  danger: { bg: colors.surface, border: colors.danger, text: colors.danger },
};

/** The app's button: spring press feedback, loading/disabled states and an optional leading icon. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  fullWidth,
  compact,
}: ButtonProps) {
  const palette = PALETTE[variant];
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.button,
        compact && styles.compact,
        fullWidth && styles.fullWidth,
        { backgroundColor: palette.bg, borderColor: palette.border },
        variant === 'primary' && !inactive && styles.elevated,
        inactive && styles.inactive,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} accessibilityElementsHidden importantForAccessibility="no" />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={palette.text} accessible={false} /> : null}
          <AppText variant="label" style={{ color: palette.text }}>
            {title}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_AREA + 4,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    minHeight: MIN_TOUCH_AREA,
    paddingHorizontal: spacing.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  elevated: {
    ...shadow.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inactive: {
    opacity: 0.55,
  },
});
