// Offline-first sync of the gamification state: summary columns, last-write-wins reconciliation, the
// cache as fallback, and the upload queue.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { reportError } from '@/utils/errors';

import { fetchRemoteGame, upsertRemoteGame } from '../api/gameRemote';
import { loadSyncedGame, saveSyncedGame } from '../api/gameSync';
import type { GameState } from '../types';
import { EMPTY_GAME_STATE } from '../utils/gameState';
import { completeSession } from '../utils/integrity';
import { reconcile, stateFromRow, summarizeGame } from '../utils/gameSync';

jest.mock('../api/gameRemote', () => ({ fetchRemoteGame: jest.fn(), upsertRemoteGame: jest.fn() }));
jest.mock('@/utils/errors', () => ({ ...jest.requireActual('@/utils/errors'), reportError: jest.fn() }));

const fetchRemote = fetchRemoteGame as jest.Mock;
const upsert = upsertRemoteGame as jest.Mock;
const TODAY = '2026-10-22';
const NOON = Date.parse('2026-10-22T12:00:00Z');

/** A state with one completed outdoor recall today, stamped at `updatedAt`. */
function trained(updatedAt: number): GameState {
  const outcome = completeSession(EMPTY_GAME_STATE, {
    commandId: 'recall',
    track: 'FORCE_FREE',
    environment: 'OUTDOOR_STIMULI',
    startedAt: NOON - 180_000,
    now: NOON,
    today: TODAY,
  });
  return { ...outcome.state, updatedAt };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  fetchRemote.mockReset();
  upsert.mockReset().mockResolvedValue(undefined);
  (reportError as jest.Mock).mockReset();
});

describe('summarizeGame', () => {
  it('maps the state onto the table columns', () => {
    expect(summarizeGame(trained(1), TODAY)).toEqual({
      xp: 50,
      level: 1,
      streakDays: 1,
      distinctActiveDays: 1,
      dailyXpEarned: 50,
      dailyXpDate: TODAY,
      unlockedTrophies: [],
      lastSessionAt: new Date(NOON).toISOString(),
    });
  });

  it('keeps trained days after old sessions roll off the log, so levels never drop', () => {
    const state = { ...trained(1), sessions: [], activeDays: ['2026-10-01', '2026-10-02', TODAY] };
    expect(summarizeGame(state, TODAY).distinctActiveDays).toBe(3);
  });
});

describe('reconcile', () => {
  it('lets the newer copy win', () => {
    const older = trained(100);
    const newer = trained(200);
    expect(reconcile(older, newer)).toEqual({ state: newer, push: false });
    expect(reconcile(newer, older)).toEqual({ state: newer, push: true });
    expect(reconcile(null, newer)).toEqual({ state: newer, push: false });
    expect(reconcile(newer, null)).toEqual({ state: newer, push: true });
    expect(reconcile(null, null).push).toBe(false);
  });

  it('reads the row clock from client_updated_at', () => {
    const row = { state: { ...trained(0) }, client_updated_at: new Date(NOON).toISOString() };
    expect(stateFromRow(row as never).updatedAt).toBe(NOON);
  });
});

describe('loadSyncedGame / saveSyncedGame', () => {
  it('restores progress from Supabase on a fresh device (e.g. after signing out and in)', async () => {
    fetchRemote.mockResolvedValue(trained(200));
    const state = await loadSyncedGame('dog-1', TODAY);
    expect(state.totalXp).toBe(50);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('pushes offline progress that is newer than the server copy', async () => {
    await saveSyncedGame('dog-1', trained(300), TODAY).then(({ uploaded }) => uploaded.catch(() => undefined));
    upsert.mockClear();
    fetchRemote.mockResolvedValue(trained(100));
    const state = await loadSyncedGame('dog-1', TODAY);
    expect(state.updatedAt).toBe(300);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(upsert).toHaveBeenCalledWith('dog-1', expect.objectContaining({ updatedAt: 300 }), expect.objectContaining({ xp: 50 }));
  });

  it('falls back to the cache offline, and fails only with nothing cached', async () => {
    fetchRemote.mockRejectedValue(new TypeError('Network request failed'));
    await expect(loadSyncedGame('dog-1', TODAY)).rejects.toThrow('Network request failed');
    await AsyncStorage.setItem('training-game:v1:dog-1', JSON.stringify(trained(5)));
    expect((await loadSyncedGame('dog-1', TODAY)).totalXp).toBe(50);
  });

  it('trains on the device alone, silently, until the migration is applied', async () => {
    const missing = Object.assign(new Error('table not found'), { code: 'PGRST205' });
    fetchRemote.mockRejectedValue(missing);
    upsert.mockRejectedValue(missing);
    expect((await loadSyncedGame('dog-1', TODAY)).totalXp).toBe(0);
    const { uploaded } = await saveSyncedGame('dog-1', trained(10), TODAY);
    await expect(uploaded).rejects.toBe(missing);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(reportError).not.toHaveBeenCalled();
  });

  it('caches before uploading, and reports an upload failure while keeping the cache', async () => {
    upsert.mockRejectedValue(new Error('violates check constraint'));
    const { uploaded } = await saveSyncedGame('dog-1', trained(400), TODAY);
    await expect(uploaded).rejects.toThrow('violates check constraint');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), 'training/syncGame');
    expect(JSON.parse((await AsyncStorage.getItem('training-game:v1:dog-1')) ?? '{}').updatedAt).toBe(400);
  });
});
