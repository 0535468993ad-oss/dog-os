import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, IconButton, SegmentedControl } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { RAPID_ACTIONS_MESSAGE_HE } from '@/features/gamification/data/rules';
import type { CompletionInput, CompletionOutcome, StepCheckInput, StepOutcome } from '@/features/gamification/types';

import { TRACK_LABELS_HE } from '../data/methodology';
import { useSessionTimer } from '../hooks/useSessionTimer';
import type { TemperamentTrait, TrainingCommand, TrainingRecommendation, TrainingTrack } from '../types';
import { protocolFor } from '../utils/protocol';
import { BalancedSafetyNotice } from './BalancedSafetyNotice';
import { CommandProtocolView } from './CommandProtocolView';
import { DogProfileBanner } from './DogProfileBanner';
import { GearBadgeRow } from './GearBadgeRow';
import { ScrollStoryCommandCard } from './ScrollStoryCommandCard';
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
  track: TrainingTrack;
  balancedAllowed: boolean;
  balancedAcknowledged: boolean;
  onClose: () => void;
  onTrackChange: (track: TrainingTrack) => void;
  onAcknowledgeBalanced: () => void;
  onChecklistStep: () => void;
  /** A step ticked during a live session: banks its XP for the session's confirmation. */
  onCheckStep: (input: Omit<StepCheckInput, 'now'>) => StepOutcome;
  onComplete: (input: Omit<CompletionInput, 'now' | 'today'>) => CompletionOutcome;
}

/** A command's full guide as a scroll story: dog banner, track switch, gear, steps, generalisation and a live session. */
export function CommandDetailModal(props: CommandDetailModalProps) {
  const { command, dog, track, balancedAllowed, balancedAcknowledged, onClose } = props;
  const timer = useSessionTimer();
  const [checked, setChecked] = useState<number[]>([]);
  const [bankedXp, setBankedXp] = useState(0);
  const [stepNotice, setStepNotice] = useState<string | null>(null);
  const balancedLocked = track === 'BALANCED' && !balancedAllowed;
  const protocolOpen = !balancedLocked && !(track === 'BALANCED' && !balancedAcknowledged);
  const protocol = command ? protocolFor(command, track) : null;

  /** Clears the checklist and ends any live session (closing, confirming or cancelling). */
  const resetSession = () => {
    setChecked([]);
    setBankedXp(0);
    setStepNotice(null);
    timer.reset();
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
                  <SegmentedControl segments={TRACKS} value={track} onChange={props.onTrackChange} accessibilityLabel={`שיטת האילוף ל${command.nameHe}`} />
                  {protocolOpen ? (
                    <>
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
              {balancedLocked ? (
                <AppText color="warning">המסלול המאוזן לא מתאים לכלב הזה לפי פרופיל המזג והגיל. נשארים בחיזוק חיובי.</AppText>
              ) : !protocolOpen ? (
                <BalancedSafetyNotice onAcknowledge={props.onAcknowledgeBalanced} />
              ) : (
                <>
                  <CommandProtocolView protocol={protocol} />
                  <TrainingSessionPanel
                    command={command}
                    track={track}
                    timer={timer}
                    bankedXp={bankedXp}
                    stepNotice={stepNotice}
                    onStart={() => {
                      // Ticks count from the start of the session, so the checklist starts clean.
                      resetSession();
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
