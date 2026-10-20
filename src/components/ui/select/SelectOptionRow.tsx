import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_AREA, spacing } from '@/constants/theme';

import { AppText } from '../AppText';
import type { SelectOption } from './selectLogic';

/** One choice in the sheet: a radio with its label, optional description and a check when selected. */
export function SelectOptionRow<T extends string>({ option, selected, onPress }: { option: SelectOption<T>; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={option.description ? `${option.label}, ${option.description}` : option.label}
      style={({ pressed }) => [selectRowStyles.option, selected && styles.selected, pressed && selectRowStyles.pressed]}
    >
      <View style={styles.text}>
        <AppText variant={selected ? 'bodyStrong' : 'body'}>{option.label}</AppText>
        {option.description ? (
          <AppText variant="caption" color="textSecondary">
            {option.description}
          </AppText>
        ) : null}
      </View>
      {selected ? <Ionicons name="checkmark" size={20} color={colors.primary} accessible={false} /> : null}
    </Pressable>
  );
}

/** Row layout shared by option rows and the "use custom value" row. */
export const selectRowStyles = StyleSheet.create({
  option: {
    minHeight: MIN_TOUCH_AREA + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.surfaceAlt,
  },
});

const styles = StyleSheet.create({
  selected: {
    backgroundColor: colors.primaryMuted,
  },
  text: {
    flex: 1,
  },
});
