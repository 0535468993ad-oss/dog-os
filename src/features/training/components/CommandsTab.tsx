import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, ErrorState, LoadingState, SectionHeader } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useActiveDog } from '@/features/dogs/hooks';
import { GameStatusCard } from '@/features/gamification/components/GameStatusCard';
import { LevelUpCelebrationModal } from '@/features/gamification/components/LevelUpCelebrationModal';
import { useGamification } from '@/features/gamification/hooks/useGamification';
import type { RankTier } from '@/features/gamification/types';
import { rankAt } from '@/features/gamification/utils/view';
import { ageInMonths, todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { TRAINING_COMMANDS } from '../data/commandsData';
import { TEMPERAMENT_LABELS_HE } from '../data/methodology';
import type { MasterCommandId, TemperamentTrait, TrainingTrack } from '../types';
import { recommendTraining } from '../utils/temperamentEngine';
import { CommandCard } from './CommandCard';
import { CommandDetailModal } from './CommandDetailModal';
import { TemperamentCard } from './TemperamentCard';

/** Narrows the stored temperament string to a known trait. */
const asTrait = (value: string | null): TemperamentTrait | null =>
  value !== null && Object.prototype.hasOwnProperty.call(TEMPERAMENT_LABELS_HE, value) ? (value as TemperamentTrait) : null;

const openVault = () => router.push('/trophy-vault');

/** The nine master commands with the rank card, the temperament engine, and level-up celebrations. */
export function CommandsTab() {
  const { activeDog, isLoading } = useActiveDog();
  const game = useGamification(activeDog?.id ?? null);
  const [openId, setOpenId] = useState<MasterCommandId | null>(null);
  const [celebrate, setCelebrate] = useState<RankTier | null>(null);

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
  const trait = asTrait(state.preferences.temperament);
  const recommendation = trait
    ? recommendTraining({ trait, ageMonths: activeDog.birth_date ? ageInMonths(activeDog.birth_date) : null, breedId: activeDog.breed_id })
    : null;
  const defaultTrack: TrainingTrack = recommendation?.track ?? 'FORCE_FREE';
  const open = TRAINING_COMMANDS.find((command) => command.id === openId) ?? null;

  return (
    <View style={styles.root}>
      <GameStatusCard state={state} today={today} dogName={activeDog.name} onOpenVault={openVault} />
      <TemperamentCard dogName={activeDog.name} trait={trait} recommendation={recommendation} onChange={game.setTemperament} />
      <SectionHeader title="9 פקודות המאסטר" />
      {TRAINING_COMMANDS.map((command) => (
        <CommandCard
          key={command.id}
          command={command}
          sessions={state.sessions.filter((session) => session.commandId === command.id).length}
          onOpen={() => setOpenId(command.id)}
        />
      ))}
      <CommandDetailModal
        command={open}
        dog={{ name: activeDog.name, breedLabel: activeDog.breed || null, breedId: activeDog.breed_id, trait, recommendation }}
        track={open ? (state.preferences.trackByCommand[open.id] ?? defaultTrack) : defaultTrack}
        balancedAllowed={recommendation?.balancedAllowed ?? true}
        balancedAcknowledged={state.preferences.balancedAcknowledged}
        onClose={() => setOpenId(null)}
        onTrackChange={(track) => open && game.setTrack(open.id, track)}
        onAcknowledgeBalanced={game.acknowledgeBalanced}
        onChecklistStep={game.checklistStep}
        onCheckStep={game.checkStep}
        onComplete={(input) => {
          const outcome = game.complete(input);
          if (outcome.levelAfter > outcome.levelBefore) {
            setOpenId(null);
            setCelebrate(rankAt(outcome.levelAfter));
          }
          return outcome;
        }}
      />
      <LevelUpCelebrationModal rank={celebrate} dogName={activeDog.name} onClose={() => setCelebrate(null)} onOpenVault={openVault} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
});
