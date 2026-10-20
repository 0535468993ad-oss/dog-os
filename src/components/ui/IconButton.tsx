import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_AREA, radius, type ColorToken } from '@/constants/theme';

import { PressableScale } from '../motion';

interface IconButtonProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Required: icon-only controls have no visible text for screen readers. */
  accessibilityLabel: string;
  onPress: () => void;
  color?: ColorToken;
  size?: number;
  disabled?: boolean;
  selected?: boolean;
  /** Draws a soft tinted disc behind the icon, for icon buttons that sit on busy content. */
  filled?: boolean;
}

/** Icon-only round button with spring press feedback and a 44pt minimum target. */
export function IconButton({ icon, accessibilityLabel, onPress, color = 'textPrimary', size = 22, disabled, selected, filled }: IconButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      hitSlop={4}
      style={[styles.button, (filled || selected) && styles.filled, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={size} color={colors[color]} accessible={false} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: MIN_TOUCH_AREA,
    minHeight: MIN_TOUCH_AREA,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: colors.surfaceAlt,
  },
  disabled: {
    opacity: 0.5,
  },
});
