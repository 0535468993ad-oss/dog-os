import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, ErrorState, LoadingState, SectionHeader, SegmentedControl } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useActiveDog } from '@/features/dogs/hooks';
import { GameStatusCard } from '@/features/gamification/components/GameStatusCard';
import { LevelUpCelebrationModal } from '@/features/gamification/components/LevelUpCelebrationModal';
import { LootBoxModal } from '@/features/gamification/components/LootBoxModal';
import { useGamification } from '@/features/gamification/hooks/useGamification';
import { weekStartOf, weeklyBossCommand } from '@/features/gamification/services/questEngine';
import type { RankTier, SessionMode } from '@/features/gamification/types';
import { starsFor } from '@/features/gamification/utils/mastery';
import { rankAt } from '@/features/gamification/utils/view';
import { PersonaSwitcherChip } from '@/features/persona/components/PersonaSwitcherChip';
import { usePersonaEngine } from '@/features/persona/hooks/usePersonaEngine';
import { todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { TRAINING_COMMANDS } from '../data/commandsData';
import { BALANCED_RULES_VERSION } from '../data/methodology';
import type { MasterCommandId } from '../types';
import { trainingContextFor } from '../utils/trackAccess';
import { CommandCard } from './CommandCard';
import { CommandDetailModal } from './CommandDetailModal';
import { CommandSkillTree } from './CommandSkillTree';
import { TemperamentCard } from './TemperamentCard';
import { TrainingPulsePanel } from './TrainingPulsePanel';

/** Narrows a command id from a route param. */
export const asCommandId = (value: string | null | undefined): MasterCommandId | null => TRAINING_COMMANDS.find((command) => command.id === value)?.id ?? null;

const openVault = () => router.push('/trophy-vault');

type View_ = 'list' | 'tree';
const VIEWS: { value: View_; label: string }[] = [
  { value: 'list', label: 'רשימה' },
  { value: 'tree', label: 'עץ כישורים' },
];

interface CommandsTabProps {
  /** A command to open on arrival (deep link from the home screen). */
  initialCommandId?: MasterCommandId | null;
  initialMode?: SessionMode;
}

/** The nine master commands with the retention strip, the skill tree, loot boxes and level-up celebrations. */
export function CommandsTab({ initialCommandId = null, initialMode = 'STANDARD' }: CommandsTabProps) {
  const { activeDog, isLoading } = useActiveDog();
  const game = useGamification(activeDog?.id ?? null);
  const persona = usePersonaEngine();
  const [openId, setOpenId] = useState<MasterCommandId | null>(initialCommandId);
  const [mode, setMode] = useState<SessionMode>(initialMode);
  const [view, setView] = useState<View_>('list');
  const [celebrate, setCelebrate] = useState<RankTier | null>(null);
  const [lootOpen, setLootOpen] = useState(false);

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
  // Recomputed from the dog as it is today, so a birth-date edit or a new assessment applies at once.
  const context = trainingContextFor({ birthDate: activeDog.birth_date, breedId: activeDog.breed_id, preferences: state.preferences, today });
  const { trait, recommendation, defaultTrack } = context;
  const open = TRAINING_COMMANDS.find((command) => command.id === openId) ?? null;
  const openCommand = (id: string, rescue = false) => {
    setMode(rescue ? 'STREAK_RESCUE' : 'STANDARD');
    setOpenId(asCommandId(id));
  };

  return (
    <View style={styles.root}>
      <PersonaSwitcherChip dogId={activeDog.id} dogName={activeDog.name} />
      <GameStatusCard state={state} today={today} dogName={activeDog.name} onOpenVault={openVault} />
      <TrainingPulsePanel game={game} dogName={activeDog.name} today={today} hour={new Date().getHours()} onOpenCommand={openCommand} onOpenLoot={() => setLootOpen(true)} />
      <TemperamentCard
        dogName={activeDog.name}
        trait={trait}
        recommendation={recommendation}
        assessed={context.assessment !== null}
        onChange={game.setTemperament}
        onOpenAssessment={() => router.push({ pathname: '/assessment', params: { dogId: activeDog.id } })}
      />
      <SectionHeader title="9 פקודות המאסטר" />
      <SegmentedControl segments={VIEWS} value={view} onChange={setView} accessibilityLabel="תצוגת הפקודות" />
      {view === 'tree' ? (
        <CommandSkillTree commands={TRAINING_COMMANDS} starsFor={(id) => starsFor(state, id)} bossId={weeklyBossCommand(weekStartOf(today))} onOpen={(id) => openCommand(id)} />
      ) : (
        TRAINING_COMMANDS.map((command) => (
          <CommandCard
            key={command.id}
            command={command}
            sessions={state.sessions.filter((session) => session.commandId === command.id).length}
            onOpen={() => openCommand(command.id)}
          />
        ))
      )}
      <CommandDetailModal
        command={open}
        dog={{ name: activeDog.name, breedLabel: activeDog.breed || null, breedId: activeDog.breed_id, trait, recommendation }}
        mode={open?.id === 'touch' ? mode : 'STANDARD'}
        stars={open ? starsFor(state, open.id) : 0}
        track={open ? (state.preferences.trackByCommand[open.id] ?? defaultTrack) : defaultTrack}
        access={context.access}
        pendingRisks={context.pending}
        lockReasonHe={context.lockReasonHe}
        onClose={() => setOpenId(null)}
        onTrackChange={(track) => open && game.setTrack(open.id, track, context.access)}
        onAcknowledgeBalanced={() => game.acknowledgeBalanced(BALANCED_RULES_VERSION, context.pending)}
        onChecklistStep={game.checklistStep}
        onCheckStep={game.checkStep}
        onRep={game.logRep}
        onStruggle={game.logStruggle}
        onComplete={(input) => {
          const outcome = game.complete(input);
          const leveledUp = outcome.levelAfter > outcome.levelBefore;
          const earnedBox = outcome.events.some((event) => event.type === 'LOOT_BOX_EARNED');
          // RN can't stack modals reliably: close the guide first. A box earned with a level-up opens once
          // the celebration closes (the chest is only visible while no celebration is showing).
          if (leveledUp || earnedBox) setOpenId(null);
          if (leveledUp) setCelebrate(rankAt(outcome.levelAfter));
          if (earnedBox) setLootOpen(true);
          return outcome;
        }}
      />
      <LevelUpCelebrationModal rank={celebrate} dogName={activeDog.name} onClose={() => setCelebrate(null)} onOpenVault={openVault} />
      <LootBoxModal
        visible={lootOpen && celebrate === null}
        prompts={[persona.lootPrompt(0), persona.lootPrompt(1), persona.lootPrompt(2)]}
        onOpen={() => game.openBox()}
        onClose={() => setLootOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
});
