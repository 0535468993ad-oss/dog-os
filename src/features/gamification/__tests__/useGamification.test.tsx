// Characterization of the gamification hook: the exact returned API, and for every action its return
// value, what it commits to the cache and device, and which haptic it plays.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { makeAnswers } from '@/test/fixtures';

import { hapticCelebrate, hapticChecklistStep, hapticExerciseDone, hapticStep, hapticWarning } from '../hooks/haptics';
import { useGamification } from '../hooks/useGamification';
import type { GameState } from '../types';

jest.mock('../api/gameRemote', () => ({ fetchRemoteGame: jest.fn(async () => null), upsertRemoteGame: jest.fn(async () => undefined) }));
jest.mock('../hooks/haptics', () => ({
  hapticCelebrate: jest.fn(),
  hapticChecklistStep: jest.fn(),
  hapticExerciseDone: jest.fn(),
  hapticStep: jest.fn(),
  hapticWarning: jest.fn(),
  hapticHeartbeat: jest.fn(),
  hapticLootTap: jest.fn(),
}));

const NOW = Date.parse('2026-10-22T09:00:00Z');
/** Lets React Query deliver a cache update (it notifies on a timer tick). */
const flush = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});
const KEY = 'training-game:v1:d1';

async function renderGame() {
  const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = await renderHook(() => useGamification('d1'), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

/** The state as cached on the device. */
async function stored(): Promise<GameState | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as GameState) : null;
}

describe('useGamification', () => {
  // Background device saves (one per action) finish before the next test starts.
  afterEach(async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('returns exactly this API', async () => {
    const { result } = await renderGame();
    expect(Object.keys(result.current).sort()).toEqual(
      ['acknowledgeBalanced', 'checkStep', 'checklistStep', 'claim', 'complete', 'dismissNotice', 'error', 'isFrozen', 'isLoading', 'logRep', 'logStruggle', 'notice', 'openBox', 'recordToxinReview', 'refetch', 'saveAssessment', 'setTemperament', 'setTrack', 'state'].sort(),
    );
    expect(result.current.notice).toBeNull();
    expect(result.current.isFrozen(NOW)).toBe(false);
  });

  it('stores preferences, refusing a balanced track for a locked dog', async () => {
    const { result } = await renderGame();
    await act(async () => result.current.setTemperament('STEADY'));
    await flush();
    expect(result.current.state.preferences.temperament).toBe('STEADY');
    let stored1 = true;
    await act(async () => {
      stored1 = result.current.setTrack('sit', 'BALANCED', 'LOCKED');
    });
    await flush();
    expect(stored1).toBe(false);
    expect(result.current.state.preferences.trackByCommand).toEqual({});
    await act(async () => {
      stored1 = result.current.setTrack('sit', 'BALANCED', 'GRANTED');
    });
    await flush();
    expect(stored1).toBe(true);
    expect(result.current.state.preferences.trackByCommand).toEqual({ sit: 'BALANCED' });
    await act(async () => result.current.acknowledgeBalanced(2, [{ id: 'ADOLESCENT', version: 1 }]));
    await flush();
    expect(result.current.state.preferences).toMatchObject({ balancedRulesAckVersion: 2, acknowledgedRisks: { ADOLESCENT: 1 } });
    await waitFor(async () => expect((await stored())?.preferences.trackByCommand).toEqual({ sit: 'BALANCED' }));
  });

  it('saves an assessment to the device, and throws when the device write fails', async () => {
    const { result } = await renderGame();
    const assessment = { answers: makeAnswers(), completedAt: '2026-10-22T09:00:00.000Z', selectedTrack: 'FORCE_FREE' as const, ownerOverrodeTrack: false };
    await act(() => result.current.saveAssessment(assessment, 'STEADY'));
    await flush();
    expect(result.current.state.preferences).toMatchObject({ assessment, temperament: 'STEADY' });
    expect((await stored())?.preferences.assessment).toEqual(assessment);
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    try {
      await expect(result.current.saveAssessment({ ...assessment, selectedTrack: 'BALANCED' }, 'STEADY')).rejects.toThrow('disk full');
      expect(result.current.state.preferences.assessment?.selectedTrack).toBe('FORCE_FREE');
    } finally {
      spy.mockRestore();
    }
  });

  it('logs reps and struggles', async () => {
    const { result } = await renderGame();
    let outcome = result.current.logRep({ commandId: 'sit', sessionStartedAt: null }, NOW);
    expect(outcome.refused).toBe('NO_LIVE_SESSION');
    expect(hapticWarning).toHaveBeenCalledTimes(1);
    await act(async () => {
      outcome = result.current.logRep({ commandId: 'sit', sessionStartedAt: NOW - 10_000 }, NOW);
    });
    await flush();
    expect(outcome).toMatchObject({ reps: 1, combo: 1 });
    expect(hapticStep).toHaveBeenCalledTimes(1);
    expect(result.current.state.repAwards).toMatchObject({ commandId: 'sit', reps: 1, combo: 1 });
    await act(async () => result.current.logStruggle('sit', NOW - 10_000));
    await flush();
    expect(result.current.state.repAwards).toMatchObject({ reps: 1, combo: 0 });
  });

  it('confirms sessions, opens loot boxes, records the toxin review and refuses unknown rewards', async () => {
    const { result } = await renderGame();
    expect(result.current.openBox(() => 0.5, NOW)).toBeNull();
    let done = result.current.complete({ commandId: 'sit', xpReward: 40, track: 'FORCE_FREE', balancedAccess: 'GRANTED', environment: 'HOME_QUIET', startedAt: NOW, mode: 'STANDARD' }, NOW);
    expect(done.blocked).toBe('SESSION_TOO_SHORT');
    expect(hapticWarning).toHaveBeenCalledTimes(1);
    await act(async () => {
      done = result.current.complete({ commandId: 'sit', xpReward: 40, track: 'FORCE_FREE', balancedAccess: 'GRANTED', environment: 'HOME_QUIET', startedAt: NOW - 180_000, mode: 'STANDARD' }, NOW);
    });
    await flush();
    expect(done.blocked).toBeUndefined();
    expect(done.xpAwarded).toBeGreaterThan(0);
    expect(hapticExerciseDone).toHaveBeenCalledTimes(1);
    const celebrated = done.events.some((event) => event.type === 'LEVEL_UP' || event.type === 'BADGE_UNLOCKED');
    expect(jest.mocked(hapticCelebrate).mock.calls.length).toBe(celebrated ? 1 : 0);
    expect(result.current.state.sessions).toHaveLength(1);
    expect(result.current.state.loot.pendingBoxes).toBe(1);
    let reward: ReturnType<typeof result.current.openBox> = null;
    await act(async () => {
      reward = result.current.openBox(() => 0.5, NOW);
    });
    await flush();
    expect(reward).not.toBeNull();
    expect(result.current.state.loot.pendingBoxes).toBe(0);
    await act(async () => {
      result.current.recordToxinReview(NOW);
    });
    await flush();
    expect(result.current.state.toxinReviewedAt).toBe(NOW);
    expect(result.current.claim('no-such-reward')).toBeDefined();
  });
  it('plays the right haptic for checklist ticks and live steps', async () => {
    const { result } = await renderGame();
    act(() => result.current.checklistStep());
    await flush();
    expect(hapticChecklistStep).toHaveBeenCalledTimes(1);
    let outcome = result.current.checkStep({ commandId: 'sit', stepIndex: 0, stepCount: 3, sessionStartedAt: null }, NOW);
    expect(outcome.refused).toBe('NO_LIVE_SESSION');
    expect(hapticChecklistStep).toHaveBeenCalledTimes(2);
    await act(async () => {
      outcome = result.current.checkStep({ commandId: 'sit', stepIndex: 0, stepCount: 3, sessionStartedAt: NOW - 1_000 }, NOW);
    });
    await flush();
    expect(outcome.refused).toBeUndefined();
    expect(outcome.bankedXp).toBeGreaterThan(0);
    expect(hapticStep).toHaveBeenCalledTimes(1);
    expect(result.current.state.stepAwards).toEqual({ sessionStartedAt: NOW - 1_000, commandId: 'sit', steps: [0] });
    // Spamming steps trips the rapid-action defence.
    await act(async () => {
      for (let i = 0; i < 40 && outcome.refused !== 'RAPID_ACTIONS'; i += 1) outcome = result.current.checkStep({ commandId: 'sit', stepIndex: 1, stepCount: 3, sessionStartedAt: NOW - 1_000 }, NOW);
    });
    await flush();
    expect(outcome.refused).toBe('RAPID_ACTIONS');
    expect(hapticWarning).toHaveBeenCalled();
  });
});
