import { BADGES } from '../data/badgesData';
import { RANKS } from '../data/ranksData';
import { LEVEL_REWARDS } from '../data/rewardsData';
import type { Badge, GameState, GamificationState, LevelReward } from '../types';
import { activeDays, badgeProgress, levelOf, longestStreak, multiplierFor, streakFor } from './progression';

// Read models for the UI: the public GamificationState, badges with progress, and rewards with their
// claim and lock state.

/** The summary the screens read. */
export function toGamificationState(state: GameState, today: string): GamificationState {
  const currentStreak = streakFor(state, today);
  const days = activeDays(state);
  return {
    totalXp: state.totalXp,
    currentLevel: levelOf(state),
    currentStreak,
    longestStreak: longestStreak(state),
    lastActiveDate: days[days.length - 1] ?? '',
    multiplier: multiplierFor(currentStreak),
    unlockedBadges: state.badges,
    claimedRewards: state.claimedRewards,
  };
}

/** Every badge with its unlock state and progress. */
export function badgesView(state: GameState): Badge[] {
  return BADGES.map((definition) => {
    const { target: _target, ...badge } = definition;
    const unlockedAt = state.badgeUnlockedAt[badge.id];
    return {
      ...badge,
      isUnlocked: state.badges.includes(badge.id),
      ...(unlockedAt ? { unlockedAt } : {}),
      progress: badgeProgress(state, definition),
    };
  });
}

export type RewardStatus = 'CLAIMED' | 'CLAIMABLE' | 'LOCKED' | 'COMING_SOON';

/** A reward with whether it can be used, claimed, or is still out of reach. */
export interface RewardView extends LevelReward {
  status: RewardStatus;
}

/** Every reward in level order, with its status for this dog. */
export function rewardsView(state: GameState): RewardView[] {
  const level = levelOf(state);
  return LEVEL_REWARDS.map((seed) => {
    const isClaimed = state.claimedRewards.includes(seed.id);
    const status: RewardStatus =
      seed.availability === 'COMING_SOON' ? 'COMING_SOON' : isClaimed ? 'CLAIMED' : level >= seed.levelRequired ? 'CLAIMABLE' : 'LOCKED';
    return { ...seed, isClaimed, status };
  });
}

/** Whether a tool reward (by payload key) is unlocked and claimed. */
export function hasReward(state: GameState, payloadKey: string): boolean {
  return LEVEL_REWARDS.some((reward) => reward.payloadKey === payloadKey && state.claimedRewards.includes(reward.id));
}

/** The rank record for a level (level 1 when out of range). */
export function rankAt(level: number) {
  const rank = RANKS.find((entry) => entry.level === level) ?? RANKS[0];
  if (!rank) throw new Error('The rank ladder is empty.');
  return rank;
}
