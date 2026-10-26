import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { UpkeepNoticeBanner } from '@/features/gamification/components/UpkeepNoticeBanner';
import { WeeklyLeagueCard } from '@/features/gamification/components/WeeklyLeagueCard';
import type { useGamification } from '@/features/gamification/hooks/useGamification';
import { leagueStandings } from '@/features/gamification/services/leagueEngine';
import { xpOn } from '@/features/gamification/services/questEngine';
import { streakFor } from '@/features/gamification/utils/progression';
import { usePersonaEngine } from '@/features/persona/hooks/usePersonaEngine';

import { TRAINING_COMMANDS } from '../data/commandsData';
import { DailyQuestBanner } from './DailyQuestBanner';

const COMMAND_NAMES: Readonly<Record<string, string>> = Object.fromEntries(TRAINING_COMMANDS.map((command) => [command.id, command.nameHe]));

interface TrainingPulsePanelProps {
  game: ReturnType<typeof useGamification>;
  dogName: string;
  today: string;
  hour: number;
  onOpenCommand: (commandId: string, rescue: boolean) => void;
  onOpenLoot: () => void;
}

/** The retention strip above the commands: launch notices, the time-of-day quest, pending loot and the weekly league. */
export function TrainingPulsePanel({ game, dogName, today, hour, onOpenCommand, onOpenLoot }: TrainingPulsePanelProps) {
  const persona = usePersonaEngine();
  const { state } = game;
  const vars = { dogName, streakDays: streakFor(state, today) };
  const standings = leagueStandings(state, today, `${dogName} (אתם)`);
  const boxes = state.loot.pendingBoxes;
  return (
    <View style={styles.root}>
      <UpkeepNoticeBanner notice={game.notice} onDismiss={game.dismissNotice} />
      <DailyQuestBanner
        hour={hour}
        xpToday={xpOn(state, today)}
        rescueBannerHe={persona.formatCopy('streakRescueUrgentBanner', vars)}
        commandNames={COMMAND_NAMES}
        onOpenCommand={onOpenCommand}
      />
      {boxes > 0 ? <Button title={`פתיחת ארגז שלל (${boxes})`} icon="cube-outline" onPress={onOpenLoot} /> : null}
      <WeeklyLeagueCard standings={standings} overtakenAlertHe={persona.formatCopy('leagueOvertakenAlert', vars)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
});
