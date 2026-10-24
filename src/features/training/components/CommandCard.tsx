import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText, Badge } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { TrainingCommand } from '../types';
import { COMMAND_CATEGORY_LABELS, COMMAND_DIFFICULTY_LABELS } from '../utils/labels';

interface CommandCardProps {
  command: TrainingCommand;
  sessions: number;
  onOpen: () => void;
}

/** One master command in the list: category, difficulty, XP reward and how often it was trained. */
export function CommandCard({ command, sessions, onOpen }: CommandCardProps) {
  const category = COMMAND_CATEGORY_LABELS[command.category];
  const difficulty = COMMAND_DIFFICULTY_LABELS[command.difficulty];
  return (
    <PressableScale
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${command.order}. ${command.nameHe} (${command.nameEn}), ${category}, ${difficulty}, ${command.xpReward} XP, ${sessions} אימונים`}
      accessibilityHint="פתיחת שלבי האימון"
      style={styles.card}
    >
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="subheading">{`${command.order}. ${command.nameHe}`}</AppText>
          <AppText variant="caption" color="textSecondary">{`${command.nameEn} · מילת הפקודה: "${command.cueHe}"`}</AppText>
        </View>
        <AppText variant="bodyStrong" color="accentMint">{`+${command.xpReward} XP`}</AppText>
      </View>
      <View style={styles.badges}>
        <Badge label={category} tone={command.category === 'LIFE_SAVING_SAFETY' ? 'danger' : 'primary'} />
        <Badge label={difficulty} />
        <Badge label={`${sessions} אימונים`} tone={sessions > 0 ? 'success' : 'neutral'} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
