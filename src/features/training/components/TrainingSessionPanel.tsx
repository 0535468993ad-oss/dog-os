import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ChipGroup, ProgressBar } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { RAPID_ACTIONS_MESSAGE_HE, SESSION_MIN_SECONDS } from '../data/gameRules';
import { useSessionTimer } from '../hooks/useSessionTimer';
import type { CompletionOutcome, MasterCommand, SessionEnvironment, TrainingTrack } from '../types';
import { formatClock, outcomeMessageHe } from '../utils/format';
import { XpFloatingBanner } from './XpFloatingBanner';

const ENVIRONMENTS: readonly { value: SessionEnvironment; label: string }[] = [
  { value: 'HOME_QUIET', label: 'בבית, בשקט' },
  { value: 'OUTDOOR_STIMULI', label: 'בחוץ, עם גירויים' },
];

interface TrainingSessionPanelProps {
  command: MasterCommand;
  track: TrainingTrack;
  onMarkStep: () => boolean;
  onComplete: (input: { commandId: MasterCommand['id']; track: TrainingTrack; environment: SessionEnvironment; startedAt: number }) => CompletionOutcome;
}

/** A live session: the timer, step marks, where it happened, and a confirm button locked until 3 minutes have passed. */
export function TrainingSessionPanel({ command, track, onMarkStep, onComplete }: TrainingSessionPanelProps) {
  const timer = useSessionTimer();
  const [environment, setEnvironment] = useState<SessionEnvironment>('HOME_QUIET');
  const [marks, setMarks] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [award, setAward] = useState({ key: 0, xp: 0, multiplier: 1 });
  const ready = timer.startedAt !== null && timer.elapsed >= SESSION_MIN_SECONDS;
  const remaining = Math.max(0, SESSION_MIN_SECONDS - timer.elapsed);

  if (timer.startedAt === null) {
    return (
      <View style={styles.root}>
        <XpFloatingBanner awardKey={award.key} xp={award.xp} multiplier={award.multiplier} />
        {message ? <Notice text={message} /> : null}
        <Button title="התחלת אימון חי" icon="timer-outline" onPress={() => { setMessage(null); setMarks(0); timer.start(); }} />
        <AppText variant="caption" color="textSecondary">{`האימון נרשם אחרי ${SESSION_MIN_SECONDS / 60} דקות של תרגול אמיתי עם הכלב.`}</AppText>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppText variant="title" center accessibilityLabel={`זמן אימון: ${formatClock(timer.elapsed)}`}>
        {formatClock(timer.elapsed)}
      </AppText>
      <ProgressBar value={Math.min(1, timer.elapsed / SESSION_MIN_SECONDS)} label="התקדמות לזמן האימון המינימלי" />
      <Button
        title={`סימון שלב (${marks})`}
        variant="secondary"
        icon="checkmark-done"
        onPress={() => {
          if (onMarkStep()) setMarks(marks + 1);
          else setMessage(RAPID_ACTIONS_MESSAGE_HE);
        }}
      />
      <ChipGroup options={ENVIRONMENTS} value={environment} onChange={setEnvironment} accessibilityLabel="איפה התאמנתם" />
      {message ? <Notice text={message} /> : null}
      <Button
        title={ready ? `אישור ביצוע: ${command.nameHe}` : `אישור ייפתח בעוד ${formatClock(remaining)}`}
        icon={ready ? 'ribbon-outline' : 'lock-closed-outline'}
        disabled={!ready}
        accessibilityHint={ready ? undefined : 'נפתח אחרי שלוש דקות של אימון חי'}
        onPress={() => {
          if (timer.startedAt === null) return;
          const outcome = onComplete({ commandId: command.id, track, environment, startedAt: timer.startedAt });
          setMessage(outcomeMessageHe(outcome));
          if (outcome.xpAwarded > 0) setAward({ key: award.key + 1, xp: outcome.xpAwarded, multiplier: outcome.multiplier });
          if (!outcome.blocked) timer.reset();
        }}
      />
      <Button title="ביטול האימון" variant="ghost" compact onPress={timer.reset} />
    </View>
  );
}

/** An announced inline notice. */
function Notice({ text }: { text: string }) {
  return (
    <View style={styles.notice} accessibilityRole="alert">
      <AppText variant="caption" color="warning">
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  notice: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningMuted,
  },
});
