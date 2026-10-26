import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ChipGroup, ProgressBar } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { XpFloatingBanner } from '@/features/gamification/components/XpFloatingBanner';
import { STEP_XP } from '@/features/gamification/data/rules';
import type { BalancedAccess, CompletionInput, CompletionOutcome, RepInput, RepOutcome, SessionEnvironment, SessionMode } from '@/features/gamification/types';
import { formatClock, outcomeMessageHe } from '@/features/gamification/utils/format';
import { usePersonaEngine } from '@/features/persona/hooks/usePersonaEngine';

import type { useSessionTimer } from '../hooks/useSessionTimer';
import type { TrainingCommand, TrainingTrack } from '../types';
import { ComboArena } from './ComboArena';
import { StruggleSheet } from './StruggleSheet';

const ENVIRONMENTS: readonly { value: SessionEnvironment; label: string }[] = [
  { value: 'HOME_QUIET', label: '⭐ בבית, בשקט' },
  { value: 'YARD_LOW_DISTRACTION', label: '⭐⭐ חצר / פארק שקט' },
  { value: 'OUTDOOR_STIMULI', label: '⭐⭐⭐ רחוב עם גירויים' },
];

interface TrainingSessionPanelProps {
  command: TrainingCommand;
  track: TrainingTrack;
  /** The dog's balanced access now: sent with the confirmation, which refuses a balanced session without it. */
  balancedAccess: BalancedAccess;
  /** STREAK_RESCUE: the 60-second touch drill. */
  mode: SessionMode;
  dogName: string;
  /** The live session timer, owned by the modal so the step checklist can see it too. */
  timer: ReturnType<typeof useSessionTimer>;
  /** XP the steps ticked in this session will pay on confirmation. */
  bankedXp: number;
  /** Why the last step tick was refused, if it was. */
  stepNotice: string | null;
  onStart: () => void;
  /** The session ended (confirmed or cancelled): the modal clears its checklist. */
  onSessionEnd: () => void;
  onComplete: (input: Omit<CompletionInput, 'now' | 'today' | 'hour'>) => CompletionOutcome;
  onRep: (input: Omit<RepInput, 'now'>) => RepOutcome;
  onStruggle: () => void;
}

/** A live session: the timer, the combo arena, where it happened, and a confirm button locked until the minimum time. */
export function TrainingSessionPanel(props: TrainingSessionPanelProps) {
  const { command, track, mode, dogName, timer, bankedXp, stepNotice } = props;
  const persona = usePersonaEngine();
  const [environment, setEnvironment] = useState<SessionEnvironment>('HOME_QUIET');
  const [message, setMessage] = useState<string | null>(null);
  const [award, setAward] = useState({ key: 0, xp: 0, multiplier: 1 });
  const [arena, setArena] = useState({ reps: 0, combo: 0, repXp: 0, praise: null as string | null });
  const [stuck, setStuck] = useState(false);
  const rescue = mode === 'STREAK_RESCUE';
  const vars = { dogName };

  const endSession = () => {
    setArena({ reps: 0, combo: 0, repXp: 0, praise: null });
    setStuck(false);
    props.onSessionEnd();
  };

  if (timer.startedAt === null) {
    return (
      <View style={styles.root}>
        <XpFloatingBanner awardKey={award.key} xp={award.xp} multiplier={award.multiplier} />
        {message ? <Notice text={message} /> : null}
        <Button title={rescue ? 'התחלת חילוץ רצף (60 שניות)' : persona.formatCopy('sessionStartCta', vars)} icon="timer-outline" onPress={() => { setMessage(null); props.onStart(); }} />
        <AppText variant="caption" color="textSecondary">{`האימון נרשם אחרי ${rescue ? '60 שניות' : '3 דקות'} של תרגול אמיתי עם הכלב.`}</AppText>
      </View>
    );
  }

  const logRep = () => {
    if (timer.startedAt === null) return;
    const outcome = props.onRep({ commandId: command.id, sessionStartedAt: timer.startedAt });
    if (outcome.refused === 'RAPID_ACTIONS' || outcome.refused === 'FROZEN') setMessage(persona.formatCopy('antiCheatSpeedWarning', vars));
    else if (outcome.refused === 'TOO_SOON') setMessage('מוקדם מדי – חזרה אמיתית לוקחת כמה שניות: פקודה, ביצוע, מרקר ותגמול.');
    else {
      setMessage(null);
      setArena({ reps: outcome.reps, combo: outcome.combo, repXp: outcome.bankedXp, praise: persona.praise(outcome.combo, vars) });
    }
  };
  const totalBanked = bankedXp + arena.repXp;

  return (
    <View style={styles.root}>
      <AppText variant="title" center accessibilityLabel={`זמן אימון: ${formatClock(timer.elapsed)}`}>
        {formatClock(timer.elapsed)}
      </AppText>
      <ProgressBar value={Math.min(1, timer.elapsed / timer.minSeconds)} label="התקדמות לזמן האימון המינימלי" />
      <ComboArena reps={arena.reps} combo={arena.combo} praise={arena.praise} onRep={logRep} onStuck={() => { props.onStruggle(); setArena({ ...arena, combo: 0 }); setStuck(true); }} />
      {stuck ? <StruggleSheet command={command} coachHe={persona.formatCopy('repStruggleCoach', vars)} onClose={() => setStuck(false)} /> : null}
      <AppText variant="caption" color="accentMint" accessibilityLiveRegion="polite">
        {totalBanked > 0 ? `נצבר באימון: +${totalBanked} XP, נזקפים עם אישור האימון` : `סמנו שלבים וחזרות: +${STEP_XP} XP לכל שלב, ובונוס קומבו על חזרות ברצף`}
      </AppText>
      {rescue ? null : <ChipGroup options={ENVIRONMENTS} value={environment} onChange={setEnvironment} accessibilityLabel="איפה התאמנתם" />}
      {stepNotice ? <Notice text={stepNotice} /> : null}
      {message ? <Notice text={message} /> : null}
      <Button
        title={timer.ready ? persona.formatCopy('sessionCompleteBtn', vars) : `אישור ייפתח בעוד ${formatClock(timer.remaining)}`}
        icon={timer.ready ? 'ribbon-outline' : 'lock-closed-outline'}
        disabled={!timer.ready}
        accessibilityLabel={timer.ready ? `אישור ביצוע: ${command.nameHe}` : undefined}
        accessibilityHint={timer.ready ? undefined : `נפתח אחרי ${rescue ? '60 שניות' : 'שלוש דקות'} של אימון חי`}
        onPress={() => {
          if (timer.startedAt === null) return;
          const outcome = props.onComplete({
            commandId: command.id,
            xpReward: command.xpReward,
            track,
            balancedAccess: props.balancedAccess,
            environment: rescue ? 'HOME_QUIET' : environment,
            startedAt: timer.startedAt,
            mode,
          });
          setMessage(outcome.blocked === 'RAPID_ACTIONS' || outcome.blocked === 'FROZEN' ? persona.formatCopy('antiCheatSpeedWarning', vars) : outcomeMessageHe(outcome));
          if (outcome.xpAwarded > 0) setAward({ key: award.key + 1, xp: outcome.xpAwarded, multiplier: outcome.multiplier });
          // A refused balanced session can't be retried as-is, so it ends like a confirmed one.
          if (!outcome.blocked || outcome.blocked === 'TRACK_NOT_ALLOWED') endSession();
        }}
      />
      <Button title="ביטול האימון" variant="ghost" compact onPress={endSession} />
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
