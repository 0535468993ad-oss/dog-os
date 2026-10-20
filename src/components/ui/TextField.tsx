import { forwardRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, MIN_TOUCH_AREA, radius, spacing, typography } from '@/constants/theme';

import { AppText } from './AppText';

interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  error?: string | null;
  hint?: string;
  optional?: boolean;
}

export type TextFieldHandle = ComponentRef<typeof TextInput>;

export const TextField = forwardRef<TextFieldHandle, TextFieldProps>(function TextField(
  { label, error, hint, optional, multiline, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const description = error ?? hint;
  return (
    <View style={styles.field}>
      <AppText variant="label" color="textSecondary">
        {label}
        {optional ? ' (רשות)' : ''}
      </AppText>
      <TextInput
        ref={ref}
        {...inputProps}
        multiline={multiline}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        accessibilityLabel={label}
        accessibilityHint={description ?? undefined}
        aria-invalid={error ? true : undefined}
        placeholderTextColor={colors.textSecondary}
        textAlign="right"
        style={[styles.input, multiline && styles.multiline, focused && styles.inputFocused, error ? styles.inputError : null]}
      />
      {description ? (
        <AppText
          variant="caption"
          color={error ? 'dangerText' : 'textSecondary'}
          accessibilityLiveRegion={error ? 'polite' : undefined}
          accessibilityRole={error ? 'alert' : undefined}
        >
          {description}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: MIN_TOUCH_AREA + 4,
    writingDirection: 'rtl',
  },
  multiline: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  // Focus is shown by a thicker, darker boundary (8.1:1), not by color alone.
  inputFocused: {
    borderColor: colors.focus,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
});
