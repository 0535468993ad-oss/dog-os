import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText, Badge, GlassCard, SegmentedControl } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { TRACK_LABELS_HE } from '../data/methodology';
import type { CompletionOutcome, MasterCommand, SessionEnvironment, TrainingTrack } from '../types';
import { protocolFor } from '../utils/protocol';
import { BalancedSafetyNotice } from './BalancedSafetyNotice';
import { CommandProtocolView } from './CommandProtocolView';
import { TrainingSessionPanel } from './TrainingSessionPanel';

const TRACKS = (Object.keys(TRACK_LABELS_HE) as TrainingTrack[]).map((value) => ({ value, label: TRACK_LABELS_HE[value] }));

interface CommandCardProps {
  command: MasterCommand;
  track: TrainingTrack;
  sessions: number;
  balancedAllowed: boolean;
  balancedAcknowledged: boolean;
  onTrackChange: (track: TrainingTrack) => void;
  onAcknowledgeBalanced: () => void;
  onMarkStep: () => boolean;
  onComplete: (input: { commandId: MasterCommand['id']; track: TrainingTrack; environment: SessionEnvironment; startedAt: number }) => CompletionOutcome;
}

/** One master command: the track switch, its protocol (behind the safety notice for balanced), and a live session. */
export function CommandCard(props: CommandCardProps) {
  const { command, track, sessions, balancedAllowed, balancedAcknowledged } = props;
  const [open, setOpen] = useState(false);
  const balancedLocked = track === 'BALANCED' && !balancedAllowed;

  return (
    <GlassCard>
      <PressableScale
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${command.order}. ${command.nameHe} (${command.nameEn}), ${sessions} אימונים`}
        style={styles.header}
      >
        <View style={styles.flex}>
          <AppText variant="subheading">{`${command.order}. ${command.nameHe}`}</AppText>
          <AppText variant="caption" color="textSecondary">{`${command.nameEn} · מילת הפקודה: "${command.cueHe}"`}</AppText>
        </View>
        <Badge label={`${sessions} אימונים`} tone={sessions > 0 ? 'success' : 'neutral'} />
      </PressableScale>

      {open ? (
        <View style={styles.body}>
          <AppText>{command.goalHe}</AppText>
          <SegmentedControl segments={TRACKS} value={track} onChange={props.onTrackChange} accessibilityLabel={`שיטת האילוף ל${command.nameHe}`} />
          {balancedLocked ? (
            <AppText color="warning">המסלול המאוזן לא מתאים לכלב הזה לפי פרופיל המזג והגיל. נשארים בחיזוק חיובי.</AppText>
          ) : track === 'BALANCED' && !balancedAcknowledged ? (
            <BalancedSafetyNotice onAcknowledge={props.onAcknowledgeBalanced} />
          ) : (
            <>
              <CommandProtocolView protocol={protocolFor(command, track)} />
              <TrainingSessionPanel command={command} track={track} onMarkStep={props.onMarkStep} onComplete={props.onComplete} />
            </>
          )}
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  body: {
    gap: spacing.md,
  },
});
