import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText } from '@/components/ui';
import { colors, glow, MIN_TOUCH_AREA, radius, spacing } from '@/constants/theme';

import type { MasterCommandId, TrainingCommand } from '../types';
import { MasteryStars } from './MasteryStars';

const BRANCHES: readonly { titleHe: string; ids: readonly MasterCommandId[] }[] = [
  { titleHe: 'משמעת ברזל', ids: ['sit', 'down', 'stay'] },
  { titleHe: 'שליטה וחירום', ids: ['touch', 'leave-it', 'recall'] },
  { titleHe: 'שטח וגבולות', ids: ['drop-it', 'place', 'heel'] },
];

interface CommandSkillTreeProps {
  commands: readonly TrainingCommand[];
  starsFor: (commandId: MasterCommandId) => number;
  /** This week's boss command: its first session pays double. */
  bossId: string;
  onOpen: (commandId: MasterCommandId) => void;
}

/**
 * The RPG skill tree: three branches of three commands, joined by connector lines that light up once
 * the node before has a star. Every node stays open – the order is a recommendation, not a lock.
 */
export function CommandSkillTree({ commands, starsFor, bossId, onOpen }: CommandSkillTreeProps) {
  const byId = new Map(commands.map((command) => [command.id, command]));
  return (
    <View style={styles.root}>
      {BRANCHES.map((branch) => (
        <View key={branch.titleHe} style={styles.branch}>
          <AppText variant="label" accessibilityRole="header">
            {branch.titleHe}
          </AppText>
          {branch.ids.map((id, index) => {
            const command = byId.get(id);
            if (!command) return null;
            const stars = starsFor(id);
            const lit = index > 0 && starsFor(branch.ids[index - 1] ?? id) > 0;
            const boss = id === bossId;
            return (
              <View key={id} style={styles.nodeWrap}>
                {index > 0 ? <View style={[styles.connector, lit && styles.connectorLit, lit && glow(colors.accentCyan)]} /> : null}
                <PressableScale
                  onPress={() => onOpen(id)}
                  style={[styles.node, stars > 0 && styles.nodeDone, boss && styles.nodeBoss]}
                  accessibilityRole="button"
                  accessibilityLabel={`${command.nameHe}, ${stars} מתוך 3 כוכבים${boss ? ', אתגר הבוס השבועי – 2x XP' : ''}`}
                >
                  <AppText variant="bodyStrong">{command.nameHe}</AppText>
                  <MasteryStars stars={stars} compact />
                  {boss ? (
                    <AppText variant="caption" color="accentOrange">
                      אתגר הבוס השבועי – 2x XP
                    </AppText>
                  ) : null}
                </PressableScale>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  branch: {
    gap: spacing.xs,
  },
  nodeWrap: {
    alignItems: 'center',
  },
  connector: {
    width: 3,
    height: spacing.md,
    backgroundColor: colors.borderStrong,
  },
  connectorLit: {
    backgroundColor: colors.accentCyan,
  },
  node: {
    alignSelf: 'stretch',
    minHeight: MIN_TOUCH_AREA,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  nodeDone: {
    borderColor: colors.accentCyan,
  },
  nodeBoss: {
    borderColor: colors.accentOrange,
    borderWidth: 2,
  },
});
