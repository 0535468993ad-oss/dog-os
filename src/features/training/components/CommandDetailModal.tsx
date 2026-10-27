import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, IconButton, SegmentedControl } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { RAPID_ACTIONS_MESSAGE_HE } from '@/features/gamification/data/rules';
import type { BalancedAccess, CompletionInput, CompletionOutcome, RepInput, RepOutcome, SessionMode, StepCheckInput, StepOutcome } from '@/features/gamification/types';
import { minSecondsFor } from '@/features/gamification/utils/integrity';

import { TRACK_LABELS_HE } from '../data/methodology';
import { useSessionTimer } from '../hooks/useSessionTimer';
import type { RiskWarning, TemperamentTrait, TrainingCommand, TrainingRecommendation, TrainingTrack } from '../types';
import { protocolFor } from '../utils/protocol';
import { effectiveTrack } from '../utils/trackAccess';
import { BalancedSafetyNotice } from './BalancedSafetyNotice';
import { CommandFocusCard } from './CommandFocusCard';
import { CommandProtocolView } from './CommandProtocolView';
import { DogProfileBanner } from './DogProfileBanner';
import { GearBadgeRow } from './GearBadgeRow';
import { ScrollStoryCommandCard } from './ScrollStoryCommandCard';
import { MasteryStars } from './MasteryStars';
import { TrainingSessionPanel } from './TrainingSessionPanel';

const TRACKS = (Object.keys(TRACK_LABELS_HE) as TrainingTrack[]).map((value) => ({ value, label: TRACK_LABELS_HE[value] }));

/** The dog the guide is personalised for. */
export interface CommandDogProfile {
  name: string;
  breedLabel: string | null;
  breedId: string | null;
  trait: TemperamentTrait | null;
  recommendation: TrainingRecommendation | null;
}

interface CommandDetailModalProps {
  command: TrainingCommand | null;
  dog: CommandDogProfile;
  /** STREAK_RESCUE opens the 60-second touch drill. */
  mode: SessionMode;
  /** Mastery stars (0–3) for this command. */
  stars: number;
  onRep: (input: Omit<RepInput, 'now'>) => RepOutcome;
  onStruggle: (commandId: string, sessionStartedAt: number | null) => void;
  /** The owner's stored choice for this command (shown as force-free while the dog is locked). */
  track: TrainingTrack;
  access: BalancedAccess;
  /** This dog's warnings still to confirm before balanced content opens. */
  pendingRisks: readonly RiskWarning[];
  /** Why the balanced track is closed (the age floor), when it is. */
  lockReasonHe: string | null;
  onClose: () => void;
  onTrackChange: (track: TrainingTrack) => void;
  onAcknowledgeBalanced: () => void;
  onChecklistStep: () => void;
  /** A step ticked during a live session: banks its XP for the session's confirmation. */
  onCheckStep: (input: Omit<StepCheckInput, 'now'>) => StepOutcome;
  onComplete: (input: Omit<CompletionInput, 'now' | 'today' | 'hour'>) => CompletionOutcome;
}

/** A command's full guide as a scroll story: dog banner, track switch, gear, steps, generalisation and a live session. */
export function CommandDetailModal(props: CommandDetailModalProps) {
  const { command, dog, track, access, onClose } = props;
  const timer = useSessionTimer(minSecondsFor(props.mode));
  const [checked, setChecked] = useState<number[]>([]);
  const [bankedXp, setBankedXp] = useState(0);
  const [stepNotice, setStepNotice] = useState<string | null>(null);
  const [lockTapped, setLockTapped] = useState(false);
  // The track a live session started with: if access changes mid-session, the confirmation is refused
  // rather than silently relabelled.
  const [sessionTrack, setSessionTrack] = useState<TrainingTrack | null>(null);
  // The age floor wins over any stored choice: a locked dog sees, runs and records force-free only.
  const shownTrack = effectiveTrack(track, access);
  const showLock = access === 'LOCKED' && (lockTapped || track === 'BALANCED');
  const protocolOpen = shownTrack === 'FORCE_FREE' || access === 'GRANTED';
  const protocol = command ? protocolFor(command, shownTrack) : null;
  const nerve = dog.recommendation?.nerve ?? null;

  /** Clears the checklist and ends any live session (closing, confirming or cancelling). */
  const resetSession = () => {
    setChecked([]);
    setBankedXp(0);
    setStepNotice(null);
    setLockTapped(false);
    setSessionTrack(null);
    timer.reset();
  };

  const changeTrack = (next: TrainingTrack) => {
    if (next === 'BALANCED' && access === 'LOCKED') {
      setLockTapped(true);
      return;
    }
    setLockTapped(false);
    props.onTrackChange(next);
  };

  const toggleStep = (index: number) => {
    if (checked.includes(index)) {
      setChecked(checked.filter((value) => value !== index));
      return;
    }
    // Outside a live session the checklist is only a guide: a light tap, no score.
    if (timer.startedAt === null || !command || !protocol) {
      props.onChecklistStep();
      setChecked([...checked, index]);
      return;
    }
    const outcome = props.onCheckStep({ commandId: command.id, stepIndex: index, stepCount: protocol.steps.length, sessionStartedAt: timer.startedAt });
    if (outcome.refused === 'RAPID_ACTIONS' || outcome.refused === 'FROZEN') {
      setStepNotice(RAPID_ACTIONS_MESSAGE_HE);
      return;
    }
    setStepNotice(null);
    setBankedXp(outcome.bankedXp);
    setChecked([...checked, index]);
  };

  return (
    <Modal visible={command !== null} animationType="slide" onRequestClose={onClose} onDismiss={resetSession}>
      <SafeAreaView style={styles.root} accessibilityViewIsModal>
        {command && protocol ? (
          <>
            <View style={styles.header}>
              <View style={styles.flex}>
                <AppText variant="title" accessibilityRole="header">{`${command.order}. ${command.nameHe}`}</AppText>
                <AppText variant="caption" color="textSecondary">{`${command.nameEn} · +${command.xpReward} XP לאימון`}</AppText>
              </View>
              <IconButton
                icon="close"
                accessibilityLabel="סגירה"
                onPress={() => {
                  resetSession();
                  onClose();
                }}
              />
            </View>
            <ScrollStoryCommandCard
              banner={<DogProfileBanner command={command} dogName={dog.name} breedLabel={dog.breedLabel} breedId={dog.breedId} trait={dog.trait} recommendation={dog.recommendation} />}
              intro={
                <>
                  <AppText>{command.targetGoal}</AppText>
                  <SegmentedControl segments={TRACKS} value={shownTrack} onChange={changeTrack} accessibilityLabel={`שיטת האילוף ל${command.nameHe}`} />
                  {showLock && props.lockReasonHe ? (
                    <AppText color="warning" accessibilityRole="alert">
                      {props.lockReasonHe}
                    </AppText>
                  ) : null}
                  {protocolOpen ? (
                    <>
                      <MasteryStars stars={props.stars} />
                      <CommandFocusCard markers={command.markers} suitableForProfiles={command.suitableForProfiles} dogName={dog.name} nerve={nerve} />
                      <GearBadgeRow gear={protocol.gear} />
                      <AppText color="textSecondary">{protocol.summaryHe}</AppText>
                    </>
                  ) : null}
                </>
              }
              steps={protocolOpen ? protocol.steps : []}
              checked={checked}
              onToggleStep={toggleStep}
            >
              {!protocolOpen ? (
                <BalancedSafetyNotice pending={props.pendingRisks} needsRules={access === 'NEEDS_RULES'} onAcknowledge={props.onAcknowledgeBalanced} />
              ) : (
                <>
                  <CommandProtocolView protocol={protocol} dogName={dog.name} nerve={nerve} balancedOpen={shownTrack === 'BALANCED' && access === 'GRANTED'} />
                  <TrainingSessionPanel
                    mode={props.mode}
                    dogName={dog.name}
                    onRep={props.onRep}
                    onStruggle={() => props.onStruggle(command.id, timer.startedAt)}
                    command={command}
                    track={sessionTrack ?? shownTrack}
                    balancedAccess={access}
                    timer={timer}
                    bankedXp={bankedXp}
                    stepNotice={stepNotice}
                    onStart={() => {
                      // Ticks count from the start of the session, so the checklist starts clean.
                      resetSession();
                      setSessionTrack(shownTrack);
                      timer.start();
                    }}
                    onSessionEnd={resetSession}
                    onComplete={props.onComplete}
                  />
                </>
              )}
            </ScrollStoryCommandCard>
          </>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
