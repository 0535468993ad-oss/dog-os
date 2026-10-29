import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, spacing, tints, type ColorToken, type TintToken } from '@/constants/theme';

export type SettingsTone = 'primary' | 'health' | 'ai' | 'alert' | 'danger' | 'info' | 'neutral';

/** Glyph color and its 12% squircle fill per tone; each pair is contrast-tested in theme.test.ts. */
export const SETTINGS_TONES: Record<SettingsTone, { icon: ColorToken; tint: TintToken }> = {
  primary: { icon: 'primaryBright', tint: 'primary' },
  health: { icon: 'healthBright', tint: 'health' },
  ai: { icon: 'aiBright', tint: 'ai' },
  alert: { icon: 'alert', tint: 'alert' },
  danger: { icon: 'dangerText', tint: 'danger' },
  info: { icon: 'info', tint: 'info' },
  neutral: { icon: 'textSecondary', tint: 'neutral' },
};

const ICON_BOX = 34;
const ROW_GAP = spacing.sm + spacing.xs;

/** How far SettingsList indents its dividers: past the icon squircle and the gap after it. */
export const SETTINGS_DIVIDER_INSET = ICON_BOX + ROW_GAP;

interface SettingsRowProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  tone?: SettingsTone;
  disabled?: boolean;
}

/** A tappable settings line: tinted icon squircle, label and a chevron. */
export function SettingsRow({ icon, label, onPress, tone = 'primary', disabled }: SettingsRowProps) {
  const { icon: iconColor, tint } = SETTINGS_TONES[tone];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={styles.row}
    >
      <View style={[styles.iconBox, { backgroundColor: tints[tint] }]} testID="settings-row-icon" accessible={false}>
        <Ionicons name={icon} size={19} color={colors[iconColor]} accessible={false} />
      </View>
      <AppText style={styles.flex}>{label}</AppText>
      <Ionicons name="chevron-back" size={18} color={colors.textSecondary} accessible={false} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ROW_GAP,
    minHeight: MIN_TOUCH_AREA + 4,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
