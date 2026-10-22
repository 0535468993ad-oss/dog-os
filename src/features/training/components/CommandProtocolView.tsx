import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { ResolvedProtocol } from '../utils/protocol';

/** A command's protocol for one track: summary, numbered steps (the last is the generalisation rule), gear and cautions. */
export function CommandProtocolView({ protocol }: { protocol: ResolvedProtocol }) {
  const lastIndex = protocol.stepsHe.length - 1;
  return (
    <View style={styles.root}>
      <AppText color="textSecondary">{protocol.summaryHe}</AppText>

      <AppText variant="label">שלבי האימון</AppText>
      <View accessibilityRole="list" style={styles.list}>
        {protocol.stepsHe.map((step, index) => (
          <View key={step} style={[styles.step, index === lastIndex && styles.generalize]} accessibilityRole="text">
            <AppText variant="bodyStrong" color={index === lastIndex ? 'accentCyan' : 'textSecondary'} style={styles.number}>
              {index + 1}
            </AppText>
            <AppText style={styles.flex}>{step}</AppText>
          </View>
        ))}
      </View>

      <AppText variant="label">ציוד טקטי</AppText>
      <View accessibilityRole="list" style={styles.list}>
        {protocol.gear.map((item) => (
          <AppText key={item.nameHe} accessibilityRole="text">
            {item.noteHe ? `• ${item.nameHe} – ${item.noteHe}` : `• ${item.nameHe}`}
          </AppText>
        ))}
      </View>

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
  list: {
    gap: spacing.xs,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
  },
  generalize: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentCyan,
    padding: spacing.sm,
  },
  number: {
    width: 20,
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  caution: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningMuted,
  },
});
