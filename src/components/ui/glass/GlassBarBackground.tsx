import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

import { barBlurIntensity, colors } from '@/constants/theme';

import { pickGlassMode } from './glassMode';
import { useReduceTransparency } from './useReduceTransparency';

/**
 * Background for a system bar (the tab bar): the dark iOS chrome material on iOS and web, an opaque fill
 * on Android and under Reduce Transparency, with a hairline separator on top either way. Decorative.
 */
export function GlassBarBackground() {
  const reduceTransparency = useReduceTransparency();
  const solid = pickGlassMode(Platform.OS, reduceTransparency) === 'solid';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
      {solid ? (
        <View testID="glass-bar-fill" style={[StyleSheet.absoluteFill, styles.solid]} />
      ) : (
        // The app is dark-only, so the bar always uses the dark material, never a light/auto tint.
        <BlurView testID="glass-bar-fill" tint="systemChromeMaterialDark" intensity={barBlurIntensity} style={[StyleSheet.absoluteFill, styles.glass]} />
      )}
      <View style={styles.separator} />
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: colors.surfaceBar,
  },
  solid: {
    backgroundColor: colors.surface,
  },
  separator: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
