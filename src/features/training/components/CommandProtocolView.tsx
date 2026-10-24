import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { ResolvedProtocol } from '../utils/protocol';

/** What follows a command's steps: the home-to-world generalisation step and the common mistakes. */
export function CommandProtocolView({ protocol }: { protocol: ResolvedProtocol }) {
  return (
    <View style={styles.root}>
      <View style={styles.generalize} accessibilityRole="text">
        <AppText variant="label" color="accentCyan">
          מהבית לעולם
        </AppText>
        <AppText>{protocol.generalizationHe}</AppText>
      </View>

      <AppText variant="label">טעויות נפוצות</AppText>
      {protocol.cautionsHe.map((caution) => (
        <View key={caution} style={styles.caution} accessibilityRole="text">
          <AppText variant="caption" color="warning">
            {caution}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  generalize: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentCyan,
  },
  caution: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningMuted,
  },
});
