import type { Json } from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';

import type { GameState, GameSummary } from '../types';
import { stateFromRow } from '../utils/gameSync';

// The dog_training_game row: one per dog, readable and writable only by its owner (RLS).

/** The server's state for a dog, or null when it has never been synced. */
export async function fetchRemoteGame(dogId: string): Promise<GameState | null> {
  const row = unwrap(await supabase.from('dog_training_game').select('state, client_updated_at').eq('dog_id', dogId).maybeSingle());
  return row ? stateFromRow(row) : null;
}

/** Writes a dog's full state and its summary columns (insert or replace). */
export async function upsertRemoteGame(dogId: string, state: GameState, summary: GameSummary): Promise<void> {
  unwrap(
    await supabase.from('dog_training_game').upsert(
      {
        dog_id: dogId,
        xp: summary.xp,
        level: summary.level,
        streak_days: summary.streakDays,
        distinct_active_days: summary.distinctActiveDays,
        daily_xp_earned: summary.dailyXpEarned,
        daily_xp_date: summary.dailyXpDate,
        unlocked_trophies: summary.unlockedTrophies,
        claimed_rewards: summary.claimedRewards,
        last_session_at: summary.lastSessionAt,
        // The state is plain JSON (numbers, strings, arrays, records) – built by parseGameState.
        state: state as unknown as Json,
        client_updated_at: new Date(state.updatedAt || Date.now()).toISOString(),
      },
      { onConflict: 'dog_id' },
    ),
  );
}
