// The command modal's balanced gate: the age lock shows force-free with its reason, this dog's warnings
// and the rules are confirmed before balanced content opens, and a session that loses access mid-way is
// refused rather than recorded.
import { render, screen, userEvent } from '@testing-library/react-native';
import type { ComponentProps, ReactElement } from 'react';

import type { CompletionInput } from '@/features/gamification/types';
import { EMPTY_GAME_STATE } from '@/features/gamification/utils/gameState';
import { completeSession } from '@/features/gamification/utils/integrity';
import { RAPID_ACTIONS_MESSAGE_HE } from '@/features/gamification/data/rules';

import { CommandDetailModal } from '../components/CommandDetailModal';
import { RISK_WARNINGS } from '../data/assessmentCopy';
import { TRAINING_COMMANDS } from '../data/commandsData';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));
jest.mock('../hooks/useSessionTimer', () => {
  const { useState } = jest.requireActual<typeof import('react')>('react');
  return {
    // Ready as soon as it starts, so the confirmation can be pressed straight away.
    useSessionTimer: (minSeconds: number) => {
      const [startedAt, setStartedAt] = useState<number | null>(null);
      return {
        startedAt,
        elapsed: startedAt === null ? 0 : minSeconds,
        minSeconds,
        remaining: 0,
        ready: startedAt !== null,
        start: () => setStartedAt(Date.now() - minSeconds * 1000),
        reset: () => setStartedAt(null),
      };
    },
  };
});

const LOCK = RISK_WARNINGS.PUPPY_FLOOR.textHe;
type ModalProps = ComponentProps<typeof CommandDetailModal>;

function modal(patch: Partial<ModalProps> = {}): ReactElement {
  const command = TRAINING_COMMANDS[0];
  if (!command) throw new Error('no commands');
  const props: ModalProps = {
    command,
    dog: { name: 'ג׳קסון', breedLabel: null, breedId: null, trait: null, recommendation: null },
    mode: 'STANDARD',
    stars: 0,
    onRep: jest.fn(),
    onStruggle: jest.fn(),
    track: 'FORCE_FREE',
    access: 'GRANTED',
    pendingRisks: [],
    lockReasonHe: null,
    onClose: jest.fn(),
    onTrackChange: jest.fn(),
    onAcknowledgeBalanced: jest.fn(),
    onChecklistStep: jest.fn(),
    onCheckStep: jest.fn(),
    onComplete: jest.fn(),
    ...patch,
  };
  return <CommandDetailModal {...props} />;
}

async function renderModal(element: ReactElement) {
  const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrap = (child: ReactElement) => <QueryClientProvider client={client}>{child}</QueryClientProvider>;
  const user = userEvent.setup();
  const view = await render(wrap(element));
  return { user, rerender: (next: ReactElement) => view.rerender(wrap(next)) };
}

describe('CommandDetailModal balanced gate', () => {
  it('shows force-free with the lock reason for a locked dog, even over a stored balanced choice', async () => {
    const onTrackChange = jest.fn();
    const { user } = await renderModal(modal({ track: 'BALANCED', access: 'LOCKED', lockReasonHe: LOCK, onTrackChange }));
    expect(screen.getByText(LOCK)).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'חיזוק חיובי (R+)', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'שלב 1: פיתוי' })).toBeOnTheScreen();
    await user.press(screen.getByRole('tab', { name: 'אילוף מאוזן' }));
    expect(onTrackChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'פתיחת המסלול המאוזן' })).toBeNull();
  });

  it("asks only for this dog's warning when the rules are already confirmed", async () => {
    const onAcknowledgeBalanced = jest.fn();
    const { user } = await renderModal(modal({ track: 'BALANCED', access: 'NEEDS_RISKS', pendingRisks: [RISK_WARNINGS.SENSITIVE_NERVE], onAcknowledgeBalanced }));
    expect(screen.getByText('אזהרות שמתאימות לכלב הזה')).toBeOnTheScreen();
    expect(screen.getByText(RISK_WARNINGS.SENSITIVE_NERVE.textHe)).toBeOnTheScreen();
    expect(screen.queryByText('לפני המסלול המאוזן – כללי בטיחות')).toBeNull();
    expect(screen.getByRole('button', { name: 'פתיחת המסלול המאוזן' })).toBeDisabled();
    await user.press(screen.getByRole('checkbox', { name: 'קראתי את האזהרות, ואשתמש בציוד רק לפי הכללים' }));
    await user.press(screen.getByRole('button', { name: 'פתיחת המסלול המאוזן' }));
    expect(onAcknowledgeBalanced).toHaveBeenCalledTimes(1);
  });

  it('shows the warnings and the rules together when both are pending, and the protocol once granted', async () => {
    const { rerender } = await renderModal(modal({ track: 'BALANCED', access: 'NEEDS_RULES', pendingRisks: [RISK_WARNINGS.ADOLESCENT] }));
    expect(screen.getByText('אזהרות שמתאימות לכלב הזה')).toBeOnTheScreen();
    expect(screen.getByText('לפני המסלול המאוזן – כללי בטיחות')).toBeOnTheScreen();
    await rerender(modal({ track: 'BALANCED', access: 'GRANTED' }));
    expect(screen.getByText(/לחץ רצועה עדין שמשתחרר ברגע הביצוע/)).toBeOnTheScreen();
  });

  it('ticks a step outside a session as a light guide, and unticks it', async () => {
    const onChecklistStep = jest.fn();
    const onCheckStep = jest.fn();
    const { user } = await renderModal(modal({ onChecklistStep, onCheckStep }));
    await user.press(screen.getByRole('checkbox', { name: 'שלב 1: פיתוי' }));
    expect(onChecklistStep).toHaveBeenCalledTimes(1);
    expect(onCheckStep).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'שלב 1: פיתוי' })).toBeChecked();
    await user.press(screen.getByRole('checkbox', { name: 'שלב 1: פיתוי' }));
    expect(screen.getByRole('checkbox', { name: 'שלב 1: פיתוי' })).not.toBeChecked();
  });

  it('banks a live step, and refuses a rapid tick with the notice', async () => {
    const onCheckStep = jest.fn((input: { stepIndex: number }) => ({ state: EMPTY_GAME_STATE, bankedXp: input.stepIndex === 0 ? 25 : 25, refused: input.stepIndex === 0 ? undefined : ('RAPID_ACTIONS' as const) }));
    const { user } = await renderModal(modal({ onCheckStep }));
    await user.press(screen.getByRole('button', { name: 'התחלת סשן' }));
    await user.press(screen.getByRole('checkbox', { name: 'שלב 1: פיתוי' }));
    expect(onCheckStep).toHaveBeenCalledWith(expect.objectContaining({ stepIndex: 0, sessionStartedAt: expect.any(Number) }));
    expect(screen.getByText('נצבר באימון: +25 XP, נזקפים עם אישור האימון')).toBeOnTheScreen();
    const [, second] = screen.getAllByRole('checkbox');
    if (!second) throw new Error('no second step');
    await user.press(second);
    expect(second).not.toBeChecked();
    expect(screen.getByText(RAPID_ACTIONS_MESSAGE_HE)).toBeOnTheScreen();
  });

  it('changes track normally when access allows, and closes', async () => {
    const onTrackChange = jest.fn();
    const onClose = jest.fn();
    const { user } = await renderModal(modal({ onTrackChange, onClose }));
    await user.press(screen.getByRole('tab', { name: 'אילוף מאוזן' }));
    expect(onTrackChange).toHaveBeenCalledWith('BALANCED');
    await user.press(screen.getByRole('button', { name: 'סגירה' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('refuses a balanced session whose dog becomes locked before confirmation, recording nothing', async () => {
    const onComplete = jest.fn((input: Omit<CompletionInput, 'now' | 'today' | 'hour'>) => completeSession(EMPTY_GAME_STATE, { ...input, now: Date.now(), today: '2026-10-22', hour: 10 }));
    const { user, rerender } = await renderModal(modal({ track: 'BALANCED', access: 'GRANTED', onComplete }));
    await user.press(screen.getByRole('button', { name: 'התחלת סשן' }));
    await rerender(modal({ track: 'BALANCED', access: 'LOCKED', lockReasonHe: LOCK, onComplete }));
    await user.press(screen.getByRole('button', { name: /^אישור ביצוע:/ }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ track: 'BALANCED', balancedAccess: 'LOCKED' }));
    expect(onComplete.mock.results[0]?.value.state.sessions).toEqual([]);
    expect(screen.getByText('המסלול המאוזן לא זמין כרגע לכלב הזה – האימון לא נרשם.')).toBeOnTheScreen();
  });
});
