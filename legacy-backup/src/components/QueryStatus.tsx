import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants';

import { Button } from './Button';

interface QueryStatusProps {
  status: 'loading' | 'error';
  message?: string;
  onRetry: () => void;
}

// Shared loading / error placeholder for screens backed by useFocusQuery.
export function QueryStatus({ status, message, onRetry }: QueryStatusProps) {
  if (status === 'loading') {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={styles.box}>
      <Text style={styles.error} accessibilityRole="alert">
        {message}
      </Text>
      <Button title="Try again" variant="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  error: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
});
