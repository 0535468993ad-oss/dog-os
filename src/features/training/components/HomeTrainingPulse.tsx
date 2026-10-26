import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/theme';
import { DogVitalityCard } from '@/features/gamification/components/DogVitalityCard';
import { useGamification } from '@/features/gamification/hooks/useGamification';
import { xpOn } from '@/features/gamification/services/questEngine';
import { computeVitality } from '@/features/gamification/services/vitalityEngine';
import { streakFor } from '@/features/gamification/utils/progression';
import { usePersonaEngine } from '@/features/persona/hooks/usePersonaEngine';
import { todayIso } from '@/utils/date';

import { findCommand, TRAINING_COMMANDS } from '../data/commandsData';
import type { MasterCommandId } from '../types';
import { DailyQuestBanner } from './DailyQuestBanner';

const COMMAND_NAMES: Readonly<Record<string, string>> = Object.fromEntries(TRAINING_COMMANDS.map((command) => [command.id, command.nameHe]));
/** Vitality at or above this reads as "high" in the persona's comment. */
const HIGH_VITALITY = 60;

/** Opens a command in the training tab (optionally as the 60-second rescue drill). */
const openCommand = (commandId: string, rescue: boolean) =>
  router.push({ pathname: '/training', params: rescue ? { command: commandId, mode: 'rescue' } : { command: commandId } });

/** The home screen's training pulse: the dog's vitality card and the time-of-day quest. */
export function HomeTrainingPulse({ dogId, dogName }: { dogId: string; dogName: string }) {
  const game = useGamification(dogId);
  const persona = usePersonaEngine();
  // The moment the card mounted: meters are a snapshot, refreshed whenever the home screen remounts.
  const [now] = useState(() => Date.now());
  if (game.isLoading || game.error) return null;
  const today = todayIso();
  const vitality = computeVitality(game.state, now, today);
  const vars = { dogName, streakDays: streakFor(game.state, today) };
  const suggested = findCommand(vitality.suggestedCommandId as MasterCommandId);
  return (
    <View style={styles.root}>
      <DailyQuestBanner
        hour={new Date(now).getHours()}
        xpToday={xpOn(game.state, today)}
        rescueBannerHe={persona.formatCopy('streakRescueUrgentBanner', vars)}
        commandNames={COMMAND_NAMES}
        onOpenCommand={openCommand}
      />
      <DogVitalityCard
        dogName={dogName}
        vitality={vitality}
        commentHe={persona.formatCopy(vitality.overall >= HIGH_VITALITY ? 'vitalityHigh' : 'vitalityLowWarning', vars)}
        suggestedCommandNameHe={suggested?.nameHe ?? 'אימון'}
        onLaunch={() => openCommand(vitality.suggestedCommandId, false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
});
