import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/constants/theme';

interface SettingsRowProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/** A tappable settings line: leading icon, label and a chevron. */
export function SettingsRow({ icon, label, onPress, disabled }: SettingsRowProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={styles.row}
    >
      <Ionicons name={icon} size={22} color={colors.primary} accessible={false} />
      <AppText style={styles.flex}>{label}</AppText>
      <Ionicons name="chevron-back" size={18} color={colors.textSecondary} accessible={false} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_AREA + 4,
    borderRadius: radius.md,
  },
});
