import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ChipGroup, ProgressBar } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { XpFloatingBanner } from '@/features/gamification/components/XpFloatingBanner';
import { SESSION_MIN_SECONDS, STEP_XP } from '@/features/gamification/data/rules';
import type { CompletionInput, CompletionOutcome, SessionEnvironment } from '@/features/gamification/types';
import { formatClock, outcomeMessageHe } from '@/features/gamification/utils/format';

import type { useSessionTimer } from '../hooks/useSessionTimer';
import type { TrainingCommand, TrainingTrack } from '../types';

const ENVIRONMENTS: readonly { value: SessionEnvironment; label: string }[] = [
  { value: 'HOME_QUIET', label: 'בבית, בשקט' },
  { value: 'OUTDOOR_STIMULI', label: 'בחוץ, עם גירויים' },
];

interface TrainingSessionPanelProps {
  command: TrainingCommand;
  track: TrainingTrack;
  /** The live session timer, owned by the modal so the step checklist can see it too. */
  timer: ReturnType<typeof useSessionTimer>;
  /** XP the steps ticked in this session will pay on confirmation. */
  bankedXp: number;
  /** Why the last step tick was refused, if it was. */
  stepNotice: string | null;
  onStart: () => void;
  /** The session ended (confirmed or cancelled): the modal clears its checklist. */
  onSessionEnd: () => void;
  onComplete: (input: Omit<CompletionInput, 'now' | 'today'>) => CompletionOutcome;
}

/** A live session: the timer, banked step XP, where it happened, and a confirm button locked until 3 minutes have passed. */
export function TrainingSessionPanel({ command, track, timer, bankedXp, stepNotice, onStart, onSessionEnd, onComplete }: TrainingSessionPanelProps) {
  const [environment, setEnvironment] = useState<SessionEnvironment>('HOME_QUIET');
  const [message, setMessage] = useState<string | null>(null);
  const [award, setAward] = useState({ key: 0, xp: 0, multiplier: 1 });
  const ready = timer.startedAt !== null && timer.elapsed >= SESSION_MIN_SECONDS;
  const remaining = Math.max(0, SESSION_MIN_SECONDS - timer.elapsed);

  if (timer.startedAt === null) {
    return (
      <View style={styles.root}>
        <XpFloatingBanner awardKey={award.key} xp={award.xp} multiplier={award.multiplier} />
        {message ? <Notice text={message} /> : null}
        <Button title="התחלת אימון חי" icon="timer-outline" onPress={() => { setMessage(null); onStart(); }} />
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
      <AppText variant="caption" color="accentMint" accessibilityLiveRegion="polite">
        {bankedXp > 0
          ? `שלבים שסומנו: +${bankedXp} XP, נזקפים עם אישור האימון`
          : `סמנו בשלבי האימון את מה שביצעתם: +${STEP_XP} XP לכל שלב, עם אישור האימון`}
      </AppText>
      <ChipGroup options={ENVIRONMENTS} value={environment} onChange={setEnvironment} accessibilityLabel="איפה התאמנתם" />
      {stepNotice ? <Notice text={stepNotice} /> : null}
      {message ? <Notice text={message} /> : null}
      <Button
        title={ready ? `אישור ביצוע: ${command.nameHe}` : `אישור ייפתח בעוד ${formatClock(remaining)}`}
        icon={ready ? 'ribbon-outline' : 'lock-closed-outline'}
        disabled={!ready}
        accessibilityHint={ready ? undefined : 'נפתח אחרי שלוש דקות של אימון חי'}
        onPress={() => {
          if (timer.startedAt === null) return;
          const outcome = onComplete({ commandId: command.id, xpReward: command.xpReward, track, environment, startedAt: timer.startedAt });
          setMessage(outcomeMessageHe(outcome));
          if (outcome.xpAwarded > 0) setAward({ key: award.key + 1, xp: outcome.xpAwarded, multiplier: outcome.multiplier });
          if (!outcome.blocked) onSessionEnd();
        }}
      />
      <Button title="ביטול האימון" variant="ghost" compact onPress={onSessionEnd} />
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
