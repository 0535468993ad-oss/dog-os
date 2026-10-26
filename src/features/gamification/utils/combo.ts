import { COMBO_TIERS } from '../data/rules';
import type { GameState } from '../types';

// The combo arena's arithmetic. Logging a rep (with its anti-spam gate) lives in integrity.ts.

/** The XP multiplier for a combo: ×1, ×2 from 3 reps in a row, ×3 from 5, FEVER ×5 from 8. */
export function comboMultiplier(combo: number): number {
  return COMBO_TIERS.find((tier) => combo >= tier.minCombo)?.multiplier ?? 1;
}

/** 0–3: which escalating praise line a combo earns (×1, ×2, ×3, FEVER). */
export function comboTierIndex(combo: number): number {
  const multiplier = comboMultiplier(combo);
  return multiplier >= 5 ? 3 : multiplier >= 3 ? 2 : multiplier >= 2 ? 1 : 0;
}

/** Rep XP banked for this live session (paid on confirmation). */
export function bankedRepXp(state: GameState, commandId: string, sessionStartedAt: number): number {
  const awards = state.repAwards;
  return awards && awards.commandId === commandId && awards.sessionStartedAt === sessionStartedAt ? awards.bankedXp : 0;
}
