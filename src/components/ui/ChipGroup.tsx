import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/theme';

import { PressableScale } from '../motion';
import { AppText } from './AppText';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface SingleProps<T extends string> {
  multiple?: false;
  value: T | null;
  onChange: (value: T) => void;
}

interface MultiProps<T extends string> {
  multiple: true;
  value: readonly T[];
  onChange: (value: T[]) => void;
}

type ChipGroupProps<T extends string> = (SingleProps<T> | MultiProps<T>) & {
  options: readonly ChipOption<T>[];
  /** Group label for screen readers. */
  accessibilityLabel: string;
  scrollable?: boolean;
  disabled?: boolean;
};

export function ChipGroup<T extends string>(props: ChipGroupProps<T>) {
  const { options, accessibilityLabel, scrollable, disabled } = props;

  const isSelected = (v: T) => (props.multiple ? props.value.includes(v) : props.value === v);

  const toggle = (v: T) => {
    if (props.multiple) {
      props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    } else {
      props.onChange(v);
    }
  };

  const chips = options.map((option) => {
    const selected = isSelected(option.value);
    return (
      <PressableScale
        key={option.value}
        onPress={() => toggle(option.value)}
        disabled={disabled}
        accessibilityRole={props.multiple ? 'checkbox' : 'radio'}
        accessibilityState={{ selected, checked: selected, disabled: !!disabled }}
        accessibilityLabel={option.label}
        style={[styles.chip, selected && styles.chipSelected]}
      >
        {/* Selection is shown by the check mark and border too, never by color alone. */}
        {selected ? <Ionicons name="checkmark" size={16} color={colors.primary} accessible={false} /> : null}
        <AppText variant="label" style={{ color: selected ? colors.primary : colors.textSecondary }}>
          {option.label}
        </AppText>
      </PressableScale>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        accessibilityRole={props.multiple ? undefined : 'radiogroup'}
        accessibilityLabel={accessibilityLabel}
      >
        {chips}
      </ScrollView>
    );
  }

  return (
    <View
      style={[styles.row, styles.wrap]}
      accessibilityRole={props.multiple ? undefined : 'radiogroup'}
      accessibilityLabel={accessibilityLabel}
    >
      {chips}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  chip: {
    minHeight: MIN_TOUCH_AREA,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
});
