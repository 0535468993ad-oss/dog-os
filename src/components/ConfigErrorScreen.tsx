import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

import { AppText } from './ui/AppText';

/**
 * Shown instead of the app when the build's public configuration is invalid (see src/config/env.ts).
 * Users get a plain message; developers also see the validation error. Renders without any providers.
 */
export function ConfigErrorScreen({ details }: { details: string }) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.icon}>
        <Ionicons name="construct-outline" size={40} color={colors.dangerText} accessible={false} />
      </View>
      <AppText variant="title" center accessibilityRole="header">
        השירות אינו זמין כרגע
      </AppText>
      <AppText center color="textSecondary" accessibilityRole="alert">
        אנחנו מטפלים בתקלה. נסו שוב מאוחר יותר.
      </AppText>
      {__DEV__ ? (
        <AppText variant="caption" color="dangerText" selectable center>
          {details}
        </AppText>
      ) : null}
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
});
