import { useEffect, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';

import { colors, radius, shadow, spacing } from '@/constants/theme';

import { AppText } from './AppText';

// App-wide error toast for actions without a screen of their own to report on – typically optimistic
// mutations that roll back. Visible and announced to screen readers (WCAG 4.1.3 status messages).

const VISIBLE_MS = 5000;

let current: { id: number; message: string } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function showToast(message: string) {
  current = { id: Date.now(), message };
  emit();
  if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(message);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function ToastHost() {
  const toast = useSyncExternalStore(subscribe, () => current, () => null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      if (current?.id === toast.id) {
        current = null;
        emit();
      }
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.toast} accessible accessibilityRole="alert" accessibilityLiveRegion="assertive">
        <AppText variant="label" style={styles.text}>
          {toast.message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: spacing.xxl,
    start: 0,
    end: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  toast: {
    maxWidth: 560,
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.card,
  },
  text: {
    color: colors.dangerText,
  },
});
