import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/theme';

import { AppText } from './AppText';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Plain-text label read by screen readers. */
  label: string;
  /** Optional rich content (e.g. text with links) rendered instead of `label`. */
  children?: ReactNode;
  error?: string | null;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, children, error, disabled }: CheckboxProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange(!checked)}
          disabled={disabled}
          accessibilityRole="checkbox"
          accessibilityState={{ checked, disabled: !!disabled }}
          accessibilityLabel={label}
          hitSlop={8}
          style={styles.hit}
        >
          <View style={[styles.box, checked && styles.boxChecked, error ? styles.boxError : null]}>
            {checked ? <Ionicons name="checkmark" size={18} color={colors.onPrimary} accessible={false} /> : null}
          </View>
        </Pressable>
        <View style={styles.label}>{children ?? <AppText>{label}</AppText>}</View>
      </View>
      {error ? (
        <AppText variant="caption" color="dangerText" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  hit: {
    minWidth: MIN_TOUCH_AREA,
    minHeight: MIN_TOUCH_AREA,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.sm,
    marginStart: -spacing.sm,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm - 2,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  boxError: {
    borderColor: colors.danger,
  },
  label: {
    flex: 1,
  },
});
