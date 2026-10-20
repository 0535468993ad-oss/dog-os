import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/constants/theme';

import { AppText } from '../AppText';
import { displayText, type SelectOption } from './selectLogic';
import { SelectSheet } from './SelectSheet';

export type { SelectOption } from './selectLogic';

interface SelectProps<T extends string> {
  label: string;
  options: readonly SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  searchable?: boolean;
  /** Lets the user pick the typed search text when nothing matches (e.g. an unlisted breed). */
  onCustomValue?: (text: string) => void;
  /** Shown instead of the option label when the current value came from onCustomValue. */
  customDisplay?: string | null;
  error?: string | null;
  disabled?: boolean;
}

/** Labelled dropdown field: a trigger showing the current choice, opening a searchable sheet. */
export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'בחרו…',
  searchable = false,
  onCustomValue,
  customDisplay,
  error,
  disabled,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const display = displayText(options, value, customDisplay);

  // Closes the sheet and resets the search for next time.
  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.field}>
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display ?? 'לא נבחר'}`}
        accessibilityHint="פותח רשימת אפשרויות"
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        style={({ pressed }) => [styles.trigger, error ? styles.triggerError : null, pressed && styles.pressed]}
      >
        <AppText color={display ? 'textPrimary' : 'textSecondary'} style={styles.triggerText} numberOfLines={1}>
          {display ?? placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} accessible={false} />
      </Pressable>
      {error ? (
        <AppText variant="caption" color="dangerText" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}

      <SelectSheet
        open={open}
        label={label}
        options={options}
        value={value}
        searchable={searchable}
        query={query}
        onQueryChange={setQuery}
        onPick={(picked) => {
          onChange(picked);
          close();
        }}
        onPickCustom={
          onCustomValue
            ? (text) => {
                onCustomValue(text);
                close();
              }
            : undefined
        }
        onClose={close}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  trigger: {
    minHeight: MIN_TOUCH_AREA + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  triggerError: {
    borderColor: colors.danger,
  },
  triggerText: {
    flex: 1,
  },
  pressed: {
    backgroundColor: colors.surfaceAlt,
  },
});
