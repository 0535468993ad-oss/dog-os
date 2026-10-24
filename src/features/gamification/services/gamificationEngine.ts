import { findReward } from '../data/rewardsData';
import type { GameState } from '../types';
import { activeDays, levelOf } from '../utils/progression';

// The engine's public entry. Level rewards live here; XP and badges are in xpEngine.ts.

export { awardXp, checkBadgeProgress } from './xpEngine';

export type ClaimRefusal = 'UNKNOWN' | 'LEVEL_TOO_LOW' | 'COMING_SOON' | 'ALREADY_CLAIMED';

/** Claims a level reward once the rank allows it and the reward is available. */
export function claimReward(state: GameState, rewardId: string): { state: GameState; refused?: ClaimRefusal } {
  const reward = findReward(rewardId);
  if (!reward) return { state, refused: 'UNKNOWN' };
  if (state.claimedRewards.includes(rewardId)) return { state, refused: 'ALREADY_CLAIMED' };
  if (reward.availability !== 'AVAILABLE') return { state, refused: 'COMING_SOON' };
  if (levelOf(state) < reward.levelRequired) return { state, refused: 'LEVEL_TOO_LOW' };
  return { state: { ...state, claimedRewards: [...state.claimedRewards, rewardId] } };
}

/** Days the dog has trained, for display. */
export const trainedDays = (state: GameState): number => activeDays(state).length;
