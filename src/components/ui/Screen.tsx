import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

import { useParallaxHeader } from '../motion';
import { useTabBarInset } from './glass/useTabBarInset';

interface ScreenProps {
  children: ReactNode;
  /** false for screens that manage their own scrolling (lists, chat). */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Tab screens have no header, so they need the top inset; stack screens with a header don't. */
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  /**
   * Scroll screens: a header with scroll-driven parallax. It trails the content inside its own clipped
   * slot, so it never slides under (and overlaps) the content below it.
   */
  parallaxHeader?: ReactNode;
  /** Receives the scroll offset (with parallaxHeader), for header content with its own scroll effects. */
  scrollY?: SharedValue<number>;
}

/** The content column's width cap; screens that scroll their own list (scroll={false}) reuse it. */
export const MAX_CONTENT_WIDTH = 720;

export function Screen({ children, scroll = true, refreshing, onRefresh, edges = ['top'], contentStyle, footer, parallaxHeader, scrollY }: ScreenProps) {
  const parallax = useParallaxHeader(scrollY);
  // Tab screens sit under the floating tab bar (0 elsewhere). Scrolling content flows beneath it and gets
  // extra end padding; fixed layouts and footers (the chat composer) are lifted above it instead.
  const tabBarInset = useTabBarInset();
  const liftAboveBar = !scroll || footer != null;
  const scrollUnderBar = tabBarInset > 0 && !liftAboveBar;

  const body = scroll ? (
    <Animated.ScrollView
      testID="screen-scroll"
      contentContainerStyle={[styles.content, contentStyle, scrollUnderBar && { paddingBottom: spacing.xxl + tabBarInset }]}
      scrollIndicatorInsets={scrollUnderBar ? { bottom: tabBarInset } : undefined}
      keyboardShouldPersistTaps="handled"
      onScroll={parallaxHeader ? parallax.onScroll : undefined}
      scrollEventThrottle={16}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        ) : undefined
      }
    >
      {parallaxHeader ? (
        <View style={styles.parallaxSlot}>
          <Animated.View style={parallax.headerStyle}>{parallaxHeader}</Animated.View>
        </View>
      ) : null}
      {children}
    </Animated.ScrollView>
  ) : (
    <View style={[styles.fill, styles.constrained, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <View testID="screen-bar-inset" style={[styles.fill, liftAboveBar && tabBarInset > 0 && { paddingBottom: tabBarInset }]}>
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
          {footer}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: {
    flex: 1,
  },
  constrained: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  parallaxSlot: {
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
});
