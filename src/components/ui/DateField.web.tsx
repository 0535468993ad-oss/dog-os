import { useId } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_AREA, radius, spacing, typography } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import type { DateFieldProps } from './DateField';

// Web: the browser's native, keyboard-accessible date input, properly labelled.
export function DateField({ label, value, onChange, minimumDate, maximumDate, error, optional, disabled, onClear }: DateFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <View style={styles.field}>
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
      {optional && value && onClear && !disabled ? (
        <Button title="ניקוי התאריך" variant="ghost" compact onPress={onClear} accessibilityLabel={`ניקוי ${label}`} />
      ) : null}
      {error ? (
        <AppText variant="caption" color="dangerText" nativeID={errorId} accessibilityRole="alert">
          {error}
        </AppText>
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

const inputStyle = {
  fontFamily: typography.body.fontFamily,
  fontSize: typography.body.fontSize,
  color: colors.textPrimary,
  backgroundColor: colors.surface,
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
});
