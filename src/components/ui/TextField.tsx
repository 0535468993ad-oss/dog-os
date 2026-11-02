import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useState, type ComponentProps, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, MIN_TOUCH_AREA, radius, spacing, typography } from '@/constants/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  error?: string | null;
  hint?: string;
  optional?: boolean;
  /** Decorative icon at the inline start of the field. */
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** With secureTextEntry: an eye button at the inline end that shows or hides the text. */
  revealable?: boolean;
  /** 'brand': the metallic bronze boundary used on the sign-in card. */
  tone?: 'default' | 'brand';
}

export type TextFieldHandle = ComponentRef<typeof TextInput>;

export const TextField = forwardRef<TextFieldHandle, TextFieldProps>(function TextField(
  { label, error, hint, optional, multiline, onFocus, onBlur, icon, revealable, tone = 'default', secureTextEntry, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const description = error ?? hint;
  return (
    <View style={styles.field}>
      <AppText variant="label" color="textSecondary">
        {label}
        {optional ? ' (רשות)' : ''}
      </AppText>
      <View
        testID="text-field-control"
        style={[
          styles.control,
          tone === 'brand' && styles.controlBrand,
          multiline && styles.multiline,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {icon ? <Ionicons name={icon} size={20} color={colors.primaryBright} accessible={false} /> : null}
        <TextInput
          ref={ref}
          {...inputProps}
          secureTextEntry={secureTextEntry === true && !(revealable && revealed)}
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
          style={[styles.input, multiline && styles.multilineInput]}
        />
        {revealable && secureTextEntry ? (
          <IconButton
            icon={revealed ? 'eye-off-outline' : 'eye-outline'}
            accessibilityLabel={revealed ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'}
            color="primaryBright"
            size={20}
            onPress={() => setRevealed((value) => !value)}
          />
        ) : null}
      </View>
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
  // The boundary lives on the row so an icon and the reveal button sit inside the field.
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingStart: spacing.md,
    paddingEnd: spacing.xs,
    minHeight: MIN_TOUCH_AREA + 4,
  },
  controlBrand: {
    borderColor: colors.accentBronze,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm + 2,
    paddingEnd: spacing.sm,
    writingDirection: 'rtl',
  },
  multiline: {
    alignItems: 'flex-start',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Focus is shown by a thicker, darker boundary (8.1:1), not by color alone.
  inputFocused: {
    borderColor: colors.focus,
    borderWidth: 2,
    backgroundColor: colors.surfaceAlt,
  },
  inputError: {
    borderColor: colors.danger,
  },
});
