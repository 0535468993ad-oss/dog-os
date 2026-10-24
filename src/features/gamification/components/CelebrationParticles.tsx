import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';

const PALETTE = [colors.accentCyan, colors.accentMint, colors.accentOrange, colors.aiBright];
const COUNT = 18;

/** Deterministic spread so the burst looks the same every time (and tests are stable). */
const PARTICLES = Array.from({ length: COUNT }, (_, i) => ({
  angle: (i / COUNT) * Math.PI * 2,
  distance: 90 + ((i * 37) % 70),
  delay: (i % 6) * 40,
  color: PALETTE[i % PALETTE.length] ?? colors.accentCyan,
  size: 6 + (i % 3) * 3,
}));

/** One particle flying out from the centre and fading. */
function Particle({ angle, distance, delay, color, size }: (typeof PARTICLES)[number]) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withDelay(delay, withTiming(1, { duration: 900 })));
  }, [delay, progress]);
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: 1 - p,
      transform: [{ translateX: Math.cos(angle) * distance * p }, { translateY: Math.sin(angle) * distance * p }, { scale: 1 - p * 0.4 }],
    };
  });
  return <Animated.View style={[styles.particle, { width: size, height: size, backgroundColor: color }, style]} />;
}

/** A celebratory burst behind the level badge; nothing at all under Reduce Motion. */
export function CelebrationParticles() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <View style={styles.origin} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
      {PARTICLES.map((particle, index) => (
        <Particle key={index} {...particle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  origin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
    borderRadius: radius.pill,
  },
});
