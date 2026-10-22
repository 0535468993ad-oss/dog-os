import { StyleSheet, View } from 'react-native';

import { AppText, Card, ErrorState, LoadingState, SectionHeader } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useActiveDog } from '@/features/dogs/hooks';
import { ageInMonths, todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { MASTER_COMMANDS } from '../data/masterCommands';
import { useTrainingGame } from '../hooks/useTrainingGame';
import type { TrainingTrack } from '../types';
import { recommendTraining } from '../utils/temperamentEngine';
import { CommandCard } from './CommandCard';
import { GameStatusCard } from './GameStatusCard';
import { TemperamentCard } from './TemperamentCard';
import { TrophyVault } from './TrophyVault';

/** The nine master commands with the temperament engine, progression, trophies and live sessions. */
export function CommandsTab() {
  const { activeDog, isLoading } = useActiveDog();
  const game = useTrainingGame(activeDog?.id ?? null);

  if (isLoading || game.isLoading) return <LoadingState />;
  if (game.error) return <ErrorState message={toUserMessage(game.error, 'לא הצלחנו לטעון את ההתקדמות באימונים.')} onRetry={game.refetch} />;
  if (!activeDog) {
    return (
      <Card tone="info">
        <AppText>הוסיפו כלב בלשונית הפרופיל כדי להתחיל להתאמן ולצבור התקדמות.</AppText>
      </Card>
    );
  }

  const { state } = game;
  const today = todayIso();
  const recommendation = state.temperament
    ? recommendTraining({ trait: state.temperament, ageMonths: activeDog.birth_date ? ageInMonths(activeDog.birth_date) : null, breedId: activeDog.breed_id })
    : null;
  const defaultTrack: TrainingTrack = recommendation?.track ?? 'FORCE_FREE';
  const balancedAllowed = recommendation?.balancedAllowed ?? true;

  return (
    <View style={styles.root}>
      <GameStatusCard state={state} today={today} dogName={activeDog.name} />
      <TemperamentCard dogName={activeDog.name} trait={state.temperament} recommendation={recommendation} onChange={game.setTemperament} />
      <SectionHeader title="9 פקודות המאסטר" />
      {MASTER_COMMANDS.map((command) => {
        const chosen = state.trackByCommand[command.id] ?? defaultTrack;
        return (
          <CommandCard
            key={command.id}
            command={command}
            track={chosen}
            sessions={state.sessions.filter((session) => session.commandId === command.id).length}
            balancedAllowed={balancedAllowed}
            balancedAcknowledged={state.balancedAcknowledged}
            onTrackChange={(track) => game.setTrack(command.id, track)}
            onAcknowledgeBalanced={game.acknowledgeBalanced}
            onMarkStep={() => game.markStep()}
            onComplete={(input) => game.complete(input)}
          />
        );
      })}
      <TrophyVault earned={state.trophies} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
});
