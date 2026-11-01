import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterAt } from '@/components/motion';
import { AppText } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';

/** Sign-in hero: paw mark in a soft halo, the product name and the screen's title. Enters once, gently. */
export function BrandHero({ title }: { title: string }) {
  return (
    <Animated.View style={styles.hero} entering={enterAt(0)}>
      <View style={styles.halo} accessible={false}>
        <View style={styles.mark}>
          <Ionicons name="paw" size={34} color={colors.onPrimary} accessible={false} />
        </View>
      </View>
      <AppText variant="display" color="primary" accessibilityRole="header" center>
        Dog OS
      </AppText>
      <AppText variant="title" center>
        {title}
      </AppText>
      <AppText color="textSecondary" center>
        אימון, בריאות ויועץ חכם – לכלב שלכם.
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  halo: {
    padding: spacing.sm,
    borderRadius: radius.xl + spacing.sm,
    backgroundColor: colors.primaryMuted,
    marginBottom: spacing.sm,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.raised,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
});
