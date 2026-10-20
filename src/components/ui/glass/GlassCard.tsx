import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { blurIntensity, colors, radius, spacing } from '@/constants/theme';

import { pickGlassMode } from './glassMode';
import { useReduceTransparency } from './useReduceTransparency';

interface GlassCardProps {
  children: ReactNode;
  /** Groups the content into one screen-reader element read with this label. */
  accessibilityLabel?: string;
  /** Blur strength, 1–100 (ignored where the card renders opaque). */
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Dark Luxury glass surface: blurred translucent card on iOS and web, opaque fill on Android and under
 * Reduce Transparency. Its text pairings are verified against `surface`, which is what the glass looks like over the canvas.
 */
export function GlassCard({ children, accessibilityLabel, intensity = blurIntensity, style, testID }: GlassCardProps) {
  const reduceTransparency = useReduceTransparency();
  const a11y = { accessible: !!accessibilityLabel, accessibilityLabel, testID };

  if (pickGlassMode(Platform.OS, reduceTransparency) === 'solid') {
    return (
      <View {...a11y} style={[styles.card, styles.solid, style]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView {...a11y} intensity={intensity} tint="dark" style={[styles.card, styles.glass, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    // Clips the blur and the fill to the rounded corners.
    overflow: 'hidden',
  },
  glass: {
    backgroundColor: colors.surfaceGlass,
  },
  solid: {
    backgroundColor: colors.surface,
  },
});
