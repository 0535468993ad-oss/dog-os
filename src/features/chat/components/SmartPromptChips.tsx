import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText } from '@/components/ui';
import { colors, glow, MIN_TOUCH_AREA, radius, spacing } from '@/constants/theme';

import type { PromptCategory, PromptChip } from '../utils/promptChips';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Text uses each hue's deep shade on its tint (≥ 4.8:1); the vivid hue is the border and the glow.
const CATEGORY_STYLE: Record<PromptCategory, { tint: string; text: string; accent: string; icon: IconName; label: string }> = {
  health: { tint: colors.healthMuted, text: colors.healthText, accent: colors.health, icon: 'medkit-outline', label: 'בריאות' },
  toxicity: { tint: colors.alertMuted, text: colors.alertText, accent: colors.alert, icon: 'warning-outline', label: 'רעילות' },
  general: { tint: colors.aiMuted, text: colors.ai, accent: colors.aiBright, icon: 'sparkles-outline', label: 'כללי' },
};

interface SmartPromptChipsProps {
  chips: readonly PromptChip[];
  /** Sends the chip's question to the advisor. */
  onPick: (question: string) => void;
  /** While a reply is pending, chips are disabled (and announced as such). */
  disabled?: boolean;
}

/** Horizontally scrolling, color-coded starter questions; tapping one sends it to the AI advisor. */
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
            style={[styles.chip, { backgroundColor: style.tint, borderColor: style.accent }, !disabled && glow(style.accent), disabled && styles.disabled]}
          >
            <Ionicons name={style.icon} size={16} color={style.text} accessible={false} />
            <AppText variant="label" style={{ color: style.text }} numberOfLines={1}>
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
    // Room for the glow, which would otherwise be clipped by the scroll view.
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: MIN_TOUCH_AREA,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.6,
  },
});
