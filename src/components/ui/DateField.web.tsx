import { useId } from 'react';
import { StyleSheet, View } from 'react-native';

import { darkTheme } from '@/constants/theme';
import { MIN_TOUCH_AREA, radius, spacing, typography } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import type { DateFieldProps } from './DateField';

const { colors } = darkTheme;

// Web: the browser's native, keyboard-accessible date input, properly labelled. Dark Luxury: color-scheme
// dark makes the browser draw its calendar icon and popup dark too. The field is its own dark container,
// so its contrast holds on light screens that haven't migrated yet.
export function DateField({ label, value, onChange, minimumDate, maximumDate, error, optional, disabled, onClear }: DateFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <View style={styles.field}>
      <View style={styles.panel}>
        <label htmlFor={id} style={labelStyle}>
          {label}
          {optional ? ' (רשות)' : ''}
        </label>
        <input
          id={id}
          type="date"
          value={value ?? ''}
          min={minimumDate}
          max={maximumDate}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            // The browser's own clear control empties the input; honour it only where clearing is allowed.
            if (event.target.value) onChange(event.target.value);
            else if (optional) onClear?.();
          }}
          style={{ ...inputStyle, borderColor: error ? colors.danger : colors.borderStrong }}
        />
        {error ? (
          <AppText variant="caption" nativeID={errorId} accessibilityRole="alert" style={styles.error}>
            {error}
          </AppText>
        ) : null}
      </View>
      {/* Outside the dark panel: the ghost button's colors are for the surface the field sits on. */}
      {optional && value && onClear && !disabled ? (
        <Button title="ניקוי התאריך" variant="ghost" compact onPress={onClear} accessibilityLabel={`ניקוי ${label}`} />
      ) : null}
    </View>
  );
}

// DOM styles: a unitless CSS lineHeight is a multiplier, so the token is converted to px.
const labelStyle = {
  fontFamily: typography.label.fontFamily,
  fontSize: typography.label.fontSize,
  lineHeight: `${typography.label.lineHeight}px`,
  color: colors.textSecondary,
} as const;

// Exported for tests.
export const inputStyle = {
  fontFamily: typography.body.fontFamily,
  fontSize: typography.body.fontSize,
  color: colors.textPrimary,
  backgroundColor: colors.surfaceSolid,
  colorScheme: 'dark',
  accentColor: colors.cyan,
  borderWidth: 1.5,
  borderStyle: 'solid',
  borderRadius: radius.md,
  paddingInline: spacing.md,
  minHeight: MIN_TOUCH_AREA + 4,
  boxSizing: 'border-box',
  width: '100%',
  direction: 'rtl',
} as const;

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  panel: {
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  error: {
    color: colors.danger,
  },
});
