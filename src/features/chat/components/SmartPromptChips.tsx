import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, spacing, tints, type ColorToken, type TintToken } from '@/constants/theme';

import type { PromptCategory, PromptChip } from '../utils/promptChips';

type IconName = ComponentProps<typeof Ionicons>['name'];

// The category color lives only in the icon badge (glyph on its 12% tint, ≥ 4.5:1); the chip itself stays a
// quiet glass card, and the spoken label names the category, so color is never the only cue.
const CATEGORY_STYLE: Record<PromptCategory, { tint: TintToken; icon: ColorToken; glyph: IconName; label: string }> = {
  health: { tint: 'health', icon: 'healthText', glyph: 'medkit-outline', label: 'בריאות' },
  toxicity: { tint: 'alert', icon: 'alertText', glyph: 'warning-outline', label: 'רעילות' },
  general: { tint: 'ai', icon: 'ai', glyph: 'sparkles-outline', label: 'כללי' },
};

interface SmartPromptChipsProps {
  chips: readonly PromptChip[];
  /** Sends the chip's question to the advisor. */
  onPick: (question: string) => void;
  /** While a reply is pending, chips are disabled (and announced as such). */
  disabled?: boolean;
}

/** Horizontally scrolling starter questions with category icon badges; tapping one sends it to the AI advisor. */
export function SmartPromptChips({ chips, onPick, disabled = false }: SmartPromptChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityLabel="שאלות מוצעות" keyboardShouldPersistTaps="handled">
      {chips.map((chip) => {
        const style = CATEGORY_STYLE[chip.category];
        return (
          <PressableScale
            key={chip.id}
            onPress={() => onPick(chip.question)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${style.label}: ${chip.question}`}
            accessibilityHint="שליחת השאלה ליועץ"
            accessibilityState={{ disabled }}
            style={[styles.chip, disabled && styles.disabled]}
          >
            <View testID={`chip-icon-${chip.category}`} style={[styles.iconBadge, { backgroundColor: tints[style.tint] }]} accessible={false}>
              <Ionicons name={style.glyph} size={14} color={colors[style.icon]} accessible={false} />
            </View>
            <AppText variant="label" color="textPrimary" numberOfLines={1}>
              {chip.question}
            </AppText>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_AREA,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingStart: spacing.xs + 2,
    paddingEnd: spacing.md,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
});
