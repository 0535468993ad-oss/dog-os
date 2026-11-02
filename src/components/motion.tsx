import { forwardRef, type ComponentRef } from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  SlideInDown,
  interpolate,
  ReduceMotion,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { SPRINGS } from '@/constants/motion';

// Motion system. Everything animates transform/opacity on the UI thread (Reanimated worklets), so it holds
// 60 FPS regardless of JS work, and everything honours the OS "reduce motion" setting (WCAG 2.3.3).
// Springs come from src/constants/motion.ts: critically damped unless the user threw something.

export const MOTION = {
  pressScale: 0.97,
  pressOpacity: 0.88,
  spring: SPRINGS.ui,
  /** Timing for state changes (selection, toggles): quick enough to feel direct, long enough to be seen. */
  durations: { fast: 150, base: 220, slow: 320 },
  staggerMs: 55,
  /** Items past this index enter together, so long lists don't wait. */
  maxStaggered: 8,
  /** Scroll distance over which the parallax header travels. */
  parallaxRange: 180,
  /** The header moves at (1 - parallaxFactor) of the content's speed. */
  parallaxFactor: 0.4,
  /** Hero card at the end of parallaxRange. Opacity stays high so its text keeps AA contrast while visible. */
  heroMinScale: 0.94,
  heroMinOpacity: 0.85,
} as const;

/** Spring "fade in from below" for list items, staggered by position. Skipped under reduced motion. */
export function enterAt(index: number) {
  return FadeInDown.springify()
    .mass(MOTION.spring.mass)
    .stiffness(MOTION.spring.stiffness)
    .damping(MOTION.spring.damping)
    .delay(Math.min(index, MOTION.maxStaggered) * MOTION.staggerMs)
    .reduceMotion(ReduceMotion.System);
}

/** A card rising into place from below (sheet-style entrances). Critically damped, skipped under reduced motion. */
export function riseIn() {
  return SlideInDown.springify()
    .mass(MOTION.spring.mass)
    .stiffness(MOTION.spring.stiffness)
    .damping(MOTION.spring.damping)
    .reduceMotion(ReduceMotion.System);
}

/**
 * Press feedback: a small scale and dim on touch-down, quick enough to read as instant, eased back on release.
 * The spring retargets from the live value, so a quick tap-and-release never jumps. Static under reduced motion.
 */
export function usePressFeedback() {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);

  const style = useAnimatedStyle(() => {
    const p = pressed.get();
    return {
      opacity: interpolate(p, [0, 1], [1, MOTION.pressOpacity]),
      transform: [{ scale: reduceMotion ? 1 : interpolate(p, [0, 1], [1, MOTION.pressScale]) }],
    };
  });

  return {
    style,
    onPressIn: () => pressed.set(withSpring(1, SPRINGS.press)),
    onPressOut: () => pressed.set(withSpring(0, SPRINGS.release)),
  };
}

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> };

/**
 * Pressable with UI-thread press feedback. Accessibility props pass straight through to the native
 * pressable, so roles, labels and states are exactly what the caller sets.
 */
export const PressableScale = forwardRef<ComponentRef<typeof Pressable>, PressableScaleProps>(function PressableScale(
  { style, onPressIn, onPressOut, ...props },
  ref,
) {
  const feedback = usePressFeedback();
  return (
    <AnimatedPressableBase
      ref={ref}
      {...props}
      onPressIn={(event: GestureResponderEvent) => {
        feedback.onPressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        feedback.onPressOut();
        onPressOut?.(event);
      }}
      style={[style, feedback.style]}
    />
  );
});

/**
 * Scroll-driven parallax for a screen's header: it trails the content upward and stretches slightly on
 * pull-down. Transforms only – text keeps full opacity, so contrast never drops while scrolling.
 */
export function useParallaxHeader(externalScrollY?: SharedValue<number>) {
  const reduceMotion = useReducedMotion();
  const ownScrollY = useSharedValue(0);
  // A caller-owned value lets content inside the header (e.g. a hero card) react to the same scroll.
  const scrollY = externalScrollY ?? ownScrollY;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  const headerStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { transform: [{ translateY: 0 }, { scale: 1 }] };
    const y = scrollY.get();
    return {
      transform: [
        { translateY: interpolate(y, [0, MOTION.parallaxRange], [0, MOTION.parallaxRange * MOTION.parallaxFactor], Extrapolation.CLAMP) },
        { scale: interpolate(y, [-120, 0], [1.06, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  return { onScroll, headerStyle, scrollY };
}

/**
 * Scroll-driven scale/opacity for a hero card: it eases back and dims slightly as the content scrolls over
 * it. Static under reduced motion.
 */
export function useHeroScrollStyle(scrollY: SharedValue<number>) {
  const reduceMotion = useReducedMotion();
  return useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 1, transform: [{ scale: 1 }] };
    const y = scrollY.get();
    return {
      opacity: interpolate(y, [0, MOTION.parallaxRange], [1, MOTION.heroMinOpacity], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(y, [0, MOTION.parallaxRange], [1, MOTION.heroMinScale], Extrapolation.CLAMP) }],
    };
  });
}
