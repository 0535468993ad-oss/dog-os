import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { NerveProfile } from '../types';
import type { ResolvedProtocol } from '../utils/protocol';
import { TroubleshootingList } from './TroubleshootingList';

interface CommandProtocolViewProps {
  protocol: ResolvedProtocol;
  dogName: string;
  nerve: NerveProfile | null;
  /** The balanced track is shown and open for this dog. */
  balancedOpen: boolean;
}

/** What follows a command's steps: the home-to-world generalisation, the balanced cautions and the troubleshooting. */
export function CommandProtocolView({ protocol, dogName, nerve, balancedOpen }: CommandProtocolViewProps) {
  return (
    <View style={styles.root}>
      <View style={styles.generalize} accessibilityRole="text">
        <AppText variant="label" color="accentBronze">
          מהבית לעולם
        </AppText>
        <AppText>{protocol.generalizationHe}</AppText>
      </View>

      {protocol.cautionsHe.length > 0 ? (
        <>
          <AppText variant="label">זהירות במסלול המאוזן</AppText>
          {protocol.cautionsHe.map((caution) => (
            <View key={caution} style={styles.caution} accessibilityRole="text">
              <AppText variant="caption" color="warning">
                {caution}
              </AppText>
            </View>
          ))}
        </>
      ) : null}

      <TroubleshootingList entries={protocol.troubleshooting} dogName={dogName} nerve={nerve} balancedOpen={balancedOpen} />
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
    borderColor: colors.accentBronze,
  },
  caution: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningMuted,
  },
});
