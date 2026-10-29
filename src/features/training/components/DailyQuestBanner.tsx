import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { questFor } from '@/features/gamification/services/questEngine';

interface DailyQuestBannerProps {
  hour: number;
  xpToday: number;
  /** The persona's urgent streak-rescue line (shown in the rescue window). */
  rescueBannerHe: string;
  onOpenCommand: (commandId: string, rescue: boolean) => void;
  /** Command names by id, for the quest's buttons. */
  commandNames: Readonly<Record<string, string>>;
}

/** The time-of-day quest: morning patrol, afternoon impulse control, or the late-evening streak rescue. */
export function DailyQuestBanner({ hour, xpToday, rescueBannerHe, onOpenCommand, commandNames }: DailyQuestBannerProps) {
  const quest = questFor(hour, xpToday);
  if (!quest) return null;
  const rescue = quest.id === 'STREAK_RESCUE';
  return (
    <View style={[styles.root, rescue && styles.rescue]} accessibilityRole={rescue ? 'alert' : 'summary'}>
      <View style={styles.title}>
        <Ionicons name={rescue ? 'flash' : 'compass-outline'} size={18} color={rescue ? colors.warning : colors.accentBronze} accessible={false} />
        <AppText variant="bodyStrong" style={styles.flex}>
          {quest.titleHe}
        </AppText>
        <AppText variant="caption" color={rescue ? 'warning' : 'accentGold'}>
          {quest.bonusHe}
        </AppText>
      </View>
      {rescue ? <AppText variant="caption">{rescueBannerHe}</AppText> : null}
      <View style={styles.actions}>
        {quest.commandIds.map((id) => (
          <Button key={id} title={rescue ? 'חילוץ ב־60 שניות: גע' : (commandNames[id] ?? id)} variant={rescue ? 'primary' : 'secondary'} compact onPress={() => onOpenCommand(id, rescue)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentBronze,
    backgroundColor: colors.surface,
  },
  rescue: {
    borderColor: colors.warning,
    backgroundColor: colors.warningMuted,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
