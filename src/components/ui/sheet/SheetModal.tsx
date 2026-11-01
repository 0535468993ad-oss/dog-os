import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Extrapolation, interpolate, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { SPRINGS } from '@/constants/motion';
import { colors, radius, spacing } from '@/constants/theme';
import { DRAG_SLOP, sheetDragOffset, shouldDismissSheet } from '@/utils/gesturePhysics';

import { AppText } from '../AppText';
import { IconButton } from '../IconButton';

interface SheetModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// Under reduced motion Reanimated jumps straight to the end value, so the sheet appears and leaves without travel.
const SHEET_SPRING = { ...SPRINGS.ui, reduceMotion: ReduceMotion.System };
// Coming to rest must never lift the sheet's bottom edge off the screen.
const TO_REST = { ...SHEET_SPRING, overshootClamping: true };

/**
 * Bottom sheet for menus and pickers: the scrim fades while the sheet springs up from the bottom edge and
 * leaves the same way. The header can be dragged; release velocity decides close-or-stay and carries into the
 * spring, and dragging above the resting place rubber-bands. Every animation starts from the live offset.
 */
export function SheetModal({ open, title, onClose, children }: SheetModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const offset = useSharedValue(windowHeight);
  const sheetHeight = useSharedValue(0);
  const releaseVelocity = useSharedValue(0);
  const dragStart = useSharedValue(0);
  // A drag that ends in a dismissal bumps this; the effect below then calls the latest onClose.
  const [dismissals, setDismissals] = useState(0);

  // Mount on open; unmount only once the closing spring has settled.
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (dismissals > 0) onClose();
    // Only a new dismissal should close – not a parent re-render that hands over a fresh onClose.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onClose is read at dismissal time on purpose
  }, [dismissals]);

  useEffect(() => {
    if (!mounted) return;
    const velocity = releaseVelocity.get();
    releaseVelocity.set(0);
    if (open) offset.set(withSpring(0, TO_REST));
    else
      offset.set(
        withSpring(windowHeight, { ...SHEET_SPRING, velocity }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
  }, [open, mounted, offset, releaseVelocity, windowHeight]);

  const pan = useMemo(() => {
    const settle = (velocity: number) => {
      if (shouldDismissSheet(offset.get(), velocity, sheetHeight.get())) {
        releaseVelocity.set(velocity);
        setDismissals((count) => count + 1);
      } else {
        offset.set(withSpring(0, { ...TO_REST, velocity }));
      }
    };
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_event, g) => Math.abs(g.dy) > DRAG_SLOP && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        cancelAnimation(offset);
        dragStart.set(offset.get());
      },
      onPanResponderMove: (_event, g) => offset.set(sheetDragOffset(dragStart.get(), g.dy, sheetHeight.get())),
      // PanResponder reports px/ms; the physics works in px/s.
      onPanResponderRelease: (_event, g) => settle(g.vy * 1000),
      onPanResponderTerminate: (_event, g) => settle(g.vy * 1000),
    });
  }, [offset, sheetHeight, releaseVelocity, dragStart]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.get(), [0, Math.max(sheetHeight.get(), 1)], [1, 0], Extrapolation.CLAMP),
  }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View
        style={styles.root}
        pointerEvents={open ? 'auto' : 'none'}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="סגירת החלונית" />
        </Animated.View>
        <Animated.View style={[styles.sheet, sheetStyle]} onLayout={(event) => sheetHeight.set(event.nativeEvent.layout.height)} accessibilityViewIsModal>
          <View {...pan.panHandlers}>
            <View style={styles.grabber} accessible={false} />
            <View style={styles.header}>
              <AppText variant="heading" accessibilityRole="header" style={styles.title}>
                {title}
              </AppText>
              <IconButton icon="close" accessibilityLabel="סגירה" onPress={onClose} />
            </View>
          </View>
          <SafeAreaView edges={['bottom']} style={styles.body}>
            {children}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopStartRadius: radius.lg,
    borderTopEndRadius: radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    marginTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingStart: spacing.md,
    paddingEnd: spacing.xs,
  },
  title: {
    flex: 1,
  },
  body: {
    flexShrink: 1,
    paddingBottom: spacing.md,
  },
});
