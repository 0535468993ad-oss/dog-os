import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import { reportError } from '@/utils/errors';

import { AppText } from './ui/AppText';
import { Button } from './ui/Button';

/**
 * Error boundary for Expo Router routes: every route file re-exports it as `ErrorBoundary`, so a render
 * crash replaces only that screen instead of blanking the app. It must not depend on app providers
 * (query client, auth, safe-area context): at the root it renders in place of the layout that mounts them.
 */
export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    reportError(error, 'route-boundary');
  }, [error]);

  const tryAgain = async () => {
    setRetrying(true);
    try {
      await retry();
    } finally {
      setRetrying(false);
    }
  };

  const goHome = () => {
    try {
      router.replace('/');
    } catch {
      // No navigator (the root itself crashed): retrying is the only way forward.
      void tryAgain();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.root}>
      <View style={styles.icon}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.dangerText} accessible={false} />
      </View>
      <AppText variant="title" center accessibilityRole="header">
        משהו השתבש
      </AppText>
      <AppText center color="textSecondary" accessibilityRole="alert">
        המסך הזה נתקל בשגיאה בלתי צפויה. המידע שלכם לא נפגע. נסו שוב, ואם הבעיה חוזרת – חזרו לדף הבית.
      </AppText>
      {__DEV__ ? (
        <AppText variant="caption" color="dangerText" selectable style={styles.details}>
          {`${error.name}: ${error.message}`}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <Button title="נסו שוב" onPress={tryAgain} loading={retrying} fullWidth />
        <Button title="חזרה לדף הבית" variant="secondary" onPress={goHome} disabled={retrying} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
});
