import { isSchemaMissingError } from '@/lib/supabase';
import { reportError } from '@/utils/errors';

import type { GameState } from '../types';
import { parseGameState } from '../utils/gameState';
import { reconcile, summarizeGame } from '../utils/gameSync';
import { fetchRemoteGame, upsertRemoteGame } from './gameRemote';
import { loadCachedGame, saveCachedGame } from './gameStorage';

// Offline-first sync of the gamification state: the cache answers immediately, Supabase is the source
// of truth, and the newer copy wins (last write wins on updatedAt).

/** Uploads run one after another per dog, so an older state never lands after a newer one. */
const queues = new Map<string, Promise<void>>();

/** Queues an upload; failures are reported and leave the cache newer, to be pushed on the next load. */
function enqueueUpload(dogId: string, state: GameState, today: string): Promise<void> {
  const previous = queues.get(dogId) ?? Promise.resolve();
  const next = previous.then(() => upsertRemoteGame(dogId, state, summarizeGame(state, today)));
  // A missing table means the migration isn't applied yet: the cache carries on alone, without noise.
  const settled = next.catch((error: unknown) => (isSchemaMissingError(error) ? undefined : reportError(error, 'training/syncGame')));
  queues.set(dogId, settled);
  return next;
}

/**
 * The dog's state: the newer of the server and the cache. Offline, the cache alone; with no cache
 * either, the server error is thrown so the screen can show it.
 */
export async function loadSyncedGame(dogId: string, today: string): Promise<GameState> {
  const cached = await loadCachedGame(dogId);
  let remote: GameState | null;
  try {
    remote = await fetchRemoteGame(dogId);
  } catch (error) {
    if (cached) return cached;
    // Before the dog_training_game migration is applied, train on the device alone.
    if (isSchemaMissingError(error)) return parseGameState(null);
    throw error;
  }
  const { state, push } = reconcile(cached, remote);
  if (state !== cached) await saveCachedGame(dogId, state);
  if (push) void enqueueUpload(dogId, state, today).catch(() => undefined);
  return state;
}

/** Caches the state, then uploads it. Resolves once cached; `uploaded` settles with the upload. */
export async function saveSyncedGame(dogId: string, state: GameState, today: string): Promise<{ uploaded: Promise<void> }> {
  await saveCachedGame(dogId, state);
  return { uploaded: enqueueUpload(dogId, state, today) };
}
