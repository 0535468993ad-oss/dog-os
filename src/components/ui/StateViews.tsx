import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

import { AppText } from './AppText';
import { Button } from './Button';

export function LoadingState({ label = 'טוען…' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={36} color={colors.textSecondary} accessible={false} />
      <AppText center color="textPrimary" accessibilityRole="alert">
        {message}
      </AppText>
      {onRetry ? <Button title="נסו שוב" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <View style={styles.iconRing} accessible={false}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={32} color={colors.primary} accessible={false} />
        </View>
      </View>
      <AppText variant="heading" center>
        {title}
      </AppText>
      {body ? (
        <AppText center color="textSecondary">
          {body}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  // A soft halo around a tinted disc gives the empty state a focal point without an illustration.
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
