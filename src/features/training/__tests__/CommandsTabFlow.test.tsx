// Characterization of the commands tab's completion flow: what a confirmed session's outcome opens –
// level-up, loot box, both (level-up only; the box stays pending), or neither – and the rescue deep link.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent } from '@testing-library/react-native';

import type { CompletionOutcome } from '@/features/gamification/types';
import { EMPTY_GAME_STATE } from '@/features/gamification/utils/gameState';

import { CommandsTab } from '../components/CommandsTab';

const mockComplete = jest.fn<CompletionOutcome, []>();

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));
jest.mock('@/features/gamification/api/gameRemote', () => ({ fetchRemoteGame: jest.fn(async () => null), upsertRemoteGame: jest.fn(async () => undefined) }));
jest.mock('@/features/dogs/hooks', () => ({
  useActiveDog: () => ({ isLoading: false, activeDog: { id: 'd1', name: 'ג׳קסון', breed: 'רועה גרמני', breed_id: 'german-shepherd', birth_date: '2023-09-01' } }),
}));
// The real hook, with `complete` returning the outcome each test chooses.
jest.mock('@/features/gamification/hooks/useGamification', () => {
  const actual = jest.requireActual<typeof import('@/features/gamification/hooks/useGamification')>('@/features/gamification/hooks/useGamification');
  return { ...actual, useGamification: (dogId: string | null) => ({ ...actual.useGamification(dogId), complete: () => mockComplete() }) };
});
// A timer that is ready as soon as it starts.
jest.mock('../hooks/useSessionTimer', () => {
  const { useState } = jest.requireActual<typeof import('react')>('react');
  return {
    useSessionTimer: (minSeconds: number) => {
      const [startedAt, setStartedAt] = useState<number | null>(null);
      return { startedAt, elapsed: startedAt === null ? 0 : minSeconds, minSeconds, remaining: 0, ready: startedAt !== null, start: () => setStartedAt(Date.now() - minSeconds * 1000), reset: () => setStartedAt(null) };
    },
  };
});

const outcome = (patch: Partial<CompletionOutcome>): CompletionOutcome => ({
  state: EMPTY_GAME_STATE, xpAwarded: 40, capped: false, multiplier: 1, levelBefore: 1, levelAfter: 1, events: [], bonuses: [], ...patch,
});

async function completeSit(result: CompletionOutcome) {
  mockComplete.mockReturnValue(result);
  const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const user = userEvent.setup();
  await render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <CommandsTab />
    </QueryClientProvider>,
  );
  await screen.findByText('ג׳קסון · קשב בסיסי');
  await user.press(screen.getByRole('button', { name: /^1\. שב/ }));
  await user.press(screen.getByRole('button', { name: 'התחלת סשן' }));
  await user.press(screen.getByRole('button', { name: /^אישור ביצוע: / }));
  return user;
}

const levelUpOpen = () => screen.queryByRole('button', { name: 'המשך אימון' }) !== null;
const lootOpen = () => screen.queryByRole('button', { name: 'אחר כך' }) !== null;
const commandOpen = () => screen.queryByRole('button', { name: 'סגירה' }) !== null;

describe('CommandsTab completion flow', () => {
  beforeEach(() => {
    mockComplete.mockReset();
    return AsyncStorage.clear();
  });

  it('a level-up closes the command and opens the celebration', async () => {
    await completeSit(outcome({ levelAfter: 2 }));
    expect([commandOpen(), levelUpOpen(), lootOpen()]).toEqual([false, true, false]);
  });

  it('a loot box closes the command and opens the chest', async () => {
    await completeSit(outcome({ events: [{ type: 'LOOT_BOX_EARNED' }] }));
    expect([commandOpen(), levelUpOpen(), lootOpen()]).toEqual([false, false, true]);
  });

  it('level-up and loot together show the celebration first, then the chest once it closes', async () => {
    const user = await completeSit(outcome({ levelAfter: 2, events: [{ type: 'LOOT_BOX_EARNED' }] }));
    expect([commandOpen(), levelUpOpen(), lootOpen()]).toEqual([false, true, false]);
    await user.press(screen.getByRole('button', { name: 'המשך אימון' }));
    expect([levelUpOpen(), lootOpen()]).toEqual([false, true]);
  });

  it('neither keeps the command open', async () => {
    await completeSit(outcome({}));
    expect([commandOpen(), levelUpOpen(), lootOpen()]).toEqual([true, false, false]);
  });

  it('the rescue deep link applies to the touch drill only', async () => {
    const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
    await render(
      <QueryClientProvider client={new QueryClient()}>
        <CommandsTab initialCommandId="touch" initialMode="STREAK_RESCUE" />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('button', { name: 'התחלת חילוץ רצף (60 שניות)' })).toBeOnTheScreen();
  });
});
