import { addDays } from '@/utils/date';

import type { GameState } from '../types';
import { streakDays } from '../utils/progression';

// Streak freeze shields. On launch, missed days since the last streak day are covered one shield each –
// but only when every missed day can be covered; a gap too wide breaks the streak and keeps the shields.

/** Covers missed days with shields; returns the covered days (empty when nothing changed). */
export function applyStreakShields(state: GameState, today: string): { state: GameState; usedDays: string[] } {
  if (state.streakShields <= 0) return { state, usedDays: [] };
  const days = streakDays(state).filter((day) => day < today);
  const last = days[days.length - 1];
  if (!last) return { state, usedDays: [] };
  const missed: string[] = [];
  // Today is still open, so only the days strictly between the last streak day and today are missed.
  for (let day = addDays(last, 1); day < today; day = addDays(day, 1)) missed.push(day);
  if (missed.length === 0 || missed.length > state.streakShields) return { state, usedDays: [] };
  return {
    state: { ...state, streakShields: state.streakShields - missed.length, shieldedDays: [...state.shieldedDays, ...missed].sort() },
    usedDays: missed,
  };
}
