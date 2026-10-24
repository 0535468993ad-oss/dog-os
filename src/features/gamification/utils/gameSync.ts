import type { TrainingGameRow } from '@/lib/database.types';

import type { GameState, GameSummary } from '../types';
import { parseGameState } from './gameState';
import { activeDays, levelOf, streakFor } from './progression';

// Pure sync logic: the summary columns the server checks, and last-write-wins reconciliation between
// the device cache and the Supabase row.

/** The summary of a state as of `today`, matching the dog_training_game columns. */
export function summarizeGame(state: GameState, today: string): GameSummary {
  const lastAt = state.sessions.reduce((latest, session) => Math.max(latest, session.at), 0);
  return {
    xp: state.totalXp,
    level: levelOf(state),
    streakDays: streakFor(state, today),
    distinctActiveDays: activeDays(state).length,
    dailyXpEarned: state.xpByDay[today] ?? 0,
    dailyXpDate: today,
    unlockedTrophies: state.badges,
    claimedRewards: state.claimedRewards,
    lastSessionAt: lastAt > 0 ? new Date(lastAt).toISOString() : null,
  };
}

/** A remote row as a game state; its sync clock is the row's client_updated_at. */
export function stateFromRow(row: Pick<TrainingGameRow, 'state' | 'client_updated_at'>): GameState {
  const state = parseGameState(row.state);
  const clock = Date.parse(row.client_updated_at);
  return { ...state, updatedAt: Number.isFinite(clock) ? Math.max(state.updatedAt, clock) : state.updatedAt };
}

export interface Reconciled {
  state: GameState;
  /** The local state is newer than the server's (offline edits) and must be uploaded. */
  push: boolean;
}

/** Last write wins on updatedAt; a tie keeps the server copy. */
export function reconcile(local: GameState | null, remote: GameState | null): Reconciled {
  if (!remote) return { state: local ?? parseGameState(null), push: !!local && local.updatedAt > 0 };
  if (!local || local.updatedAt <= remote.updatedAt) return { state: remote, push: false };
  return { state: local, push: true };
}
