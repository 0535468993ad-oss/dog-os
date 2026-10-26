// Characterization of the live-session panel: start, reps and their refusals, the locked confirm, a
// confirmed session ending, blocked confirmations (TRACK_NOT_ALLOWED ends the session), and cancel.
import { render, screen, userEvent } from '@testing-library/react-native';
import type { ComponentProps, ReactElement } from 'react';

import type { CompletionOutcome, RepOutcome } from '@/features/gamification/types';
import { EMPTY_GAME_STATE } from '@/features/gamification/utils/gameState';

import { TrainingSessionPanel } from '../components/TrainingSessionPanel';
import { TRAINING_COMMANDS } from '../data/commandsData';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

type PanelProps = ComponentProps<typeof TrainingSessionPanel>;
const idleTimer = { startedAt: null, elapsed: 0, minSeconds: 180, remaining: 180, ready: false, start: jest.fn(), reset: jest.fn() };
const liveTimer = (ready: boolean) => ({ ...idleTimer, startedAt: 1_000, elapsed: ready ? 180 : 0, remaining: ready ? 0 : 180, ready });
const outcome = (patch: Partial<CompletionOutcome> = {}): CompletionOutcome => ({
  state: EMPTY_GAME_STATE, xpAwarded: 40, capped: false, multiplier: 1, levelBefore: 1, levelAfter: 1, events: [], bonuses: [], ...patch,
});
const rep = (patch: Partial<RepOutcome> = {}): RepOutcome => ({ state: EMPTY_GAME_STATE, reps: 1, combo: 1, bankedXp: 5, ...patch });

function panel(patch: Partial<PanelProps> = {}): ReactElement {
  const command = TRAINING_COMMANDS[0];
  if (!command) throw new Error('no commands');
  const props: PanelProps = {
    command,
    track: 'FORCE_FREE',
    balancedAccess: 'GRANTED',
    mode: 'STANDARD',
    dogName: 'ג׳קסון',
    timer: idleTimer,
    bankedXp: 0,
    stepNotice: null,
    onStart: jest.fn(),
    onSessionEnd: jest.fn(),
    onComplete: jest.fn(() => outcome()),
    onRep: jest.fn(() => rep()),
    onStruggle: jest.fn(),
    ...patch,
  };
  return <TrainingSessionPanel {...props} />;
}

async function renderPanel(element: ReactElement) {
  const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const user = userEvent.setup();
  await render(<QueryClientProvider client={new QueryClient()}>{element}</QueryClientProvider>);
  return user;
}

describe('TrainingSessionPanel', () => {
  it('starts a session from the idle view', async () => {
    const onStart = jest.fn();
    const user = await renderPanel(panel({ onStart }));
    expect(screen.getByText('האימון נרשם אחרי 3 דקות של תרגול אמיתי עם הכלב.')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'התחלת סשן' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('keeps confirm locked until the minimum time', async () => {
    await renderPanel(panel({ timer: liveTimer(false) }));
    expect(screen.getByRole('button', { name: /אישור ייפתח בעוד 3:00/ })).toBeDisabled();
  });

  it('logs a rep with praise, and explains a too-soon or spam rep', async () => {
    const onRep = jest.fn(() => rep());
    const user = await renderPanel(panel({ timer: liveTimer(false), onRep }));
    await user.press(screen.getByRole('button', { name: 'חזרה מוצלחת' }));
    expect(onRep).toHaveBeenCalledWith({ commandId: TRAINING_COMMANDS[0]?.id, sessionStartedAt: 1_000 });
    expect(screen.getByText('נצבר באימון: +5 XP, נזקפים עם אישור האימון')).toBeOnTheScreen();
    onRep.mockReturnValueOnce(rep({ refused: 'TOO_SOON' }));
    await user.press(screen.getByRole('button', { name: 'חזרה מוצלחת' }));
    expect(screen.getByText(/^מוקדם מדי/)).toBeOnTheScreen();
    onRep.mockReturnValueOnce(rep({ refused: 'RAPID_ACTIONS' }));
    await user.press(screen.getByRole('button', { name: 'חזרה מוצלחת' }));
    expect(screen.getByText(/^קצב הרישום מהיר מדי/)).toBeOnTheScreen();
  });

  it('confirms a ready session with the full input and ends it', async () => {
    const onComplete = jest.fn(() => outcome());
    const onSessionEnd = jest.fn();
    const user = await renderPanel(panel({ timer: liveTimer(true), track: 'BALANCED', balancedAccess: 'LOCKED', onComplete, onSessionEnd }));
    await user.press(screen.getByRole('button', { name: /^אישור ביצוע: / }));
    expect(onComplete).toHaveBeenCalledWith({
      commandId: TRAINING_COMMANDS[0]?.id,
      xpReward: TRAINING_COMMANDS[0]?.xpReward,
      track: 'BALANCED',
      balancedAccess: 'LOCKED',
      environment: 'HOME_QUIET',
      startedAt: 1_000,
      mode: 'STANDARD',
    });
    expect(onSessionEnd).toHaveBeenCalledTimes(1);
  });

  it('keeps a blocked session open, except a refused balanced one', async () => {
    const onSessionEnd = jest.fn();
    const onComplete = jest.fn(() => outcome({ blocked: 'SESSION_TOO_SHORT', xpAwarded: 0 }));
    const user = await renderPanel(panel({ timer: liveTimer(true), onComplete, onSessionEnd }));
    await user.press(screen.getByRole('button', { name: /^אישור ביצוע: / }));
    expect(onSessionEnd).not.toHaveBeenCalled();
    onComplete.mockReturnValueOnce(outcome({ blocked: 'TRACK_NOT_ALLOWED', xpAwarded: 0 }));
    await user.press(screen.getByRole('button', { name: /^אישור ביצוע: / }));
    expect(onSessionEnd).toHaveBeenCalledTimes(1);
  });

  it('cancels a session', async () => {
    const onSessionEnd = jest.fn();
    const user = await renderPanel(panel({ timer: liveTimer(false), onSessionEnd }));
    await user.press(screen.getByRole('button', { name: 'ביטול האימון' }));
    expect(onSessionEnd).toHaveBeenCalledTimes(1);
  });
});
