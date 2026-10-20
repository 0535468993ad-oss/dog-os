import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, typography, type ColorToken, type TypographyVariant } from '@/theme';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  center?: boolean;
}

// All app text goes through here so font, size and RTL-friendly alignment stay consistent.
// Text aligns to the start of the reading direction (right in Hebrew) unless centered.
export function AppText({ variant = 'body', color = 'textPrimary', center, style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[typography[variant], { color: colors[color] }, styles.base, center && styles.center, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    writingDirection: 'rtl',
  },
  center: {
    textAlign: 'center',
  },
});
