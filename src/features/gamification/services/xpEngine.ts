import { BADGES } from '../data/badgesData';
import { DAILY_XP_CAP } from '../data/rules';
import type { BadgeAction, BadgeId, GameEvent, GameState } from '../types';
import { badgeProgress, levelOf, multiplierFor, streakFor } from '../utils/progression';

// XP and badges. Every award goes through awardXp, so the streak multiplier, the daily cap and
// level-up events apply the same way to sessions and to the steps a session pays for.

export interface XpAwardInput {
  amount: number;
  reason: string;
  now: number;
  today: string;
}

export interface XpAward {
  state: GameState;
  awarded: number;
  /** The daily cap cut the award. */
  capped: boolean;
  multiplier: number;
  events: GameEvent[];
}

/** Awards XP for today's training: streak multiplier first, then the daily cap; reports level-ups. */
export function awardXp(state: GameState, input: XpAwardInput): XpAward {
  const levelBefore = levelOf(state);
  // Today is a training day once something is awarded for it, so it counts towards the streak.
  const trained = state.activeDays.includes(input.today) ? state : { ...state, activeDays: [...state.activeDays, input.today].sort() };
  const multiplier = multiplierFor(streakFor(trained, input.today));
  const earned = Math.round(Math.max(0, input.amount) * multiplier);
  const earnedToday = trained.xpByDay[input.today] ?? 0;
  const awarded = Math.min(earned, Math.max(0, DAILY_XP_CAP - earnedToday));
  const next: GameState = {
    ...trained,
    totalXp: trained.totalXp + awarded,
    xpByDay: { ...trained.xpByDay, [input.today]: earnedToday + awarded },
  };
  const levelAfter = levelOf(next);
  const events: GameEvent[] = [];
  if (awarded > 0) events.push({ type: 'XP_AWARDED', amount: awarded, multiplier, reason: input.reason });
  if (levelAfter > levelBefore) events.push({ type: 'LEVEL_UP', from: levelBefore, to: levelAfter });
  return { state: next, awarded, capped: awarded < earned, multiplier, events };
}

/** Applies a badge action and unlocks every badge whose target is now met. */
export function checkBadgeProgress(state: GameState, action: BadgeAction, now: number): { state: GameState; events: GameEvent[] } {
  // Sessions are already in the log; only the toxin review is a fact the log doesn't hold.
  const acted = action.type === 'TOXIN_REVIEWED' ? { ...state, toxinReviewedAt: now } : state;
  const unlocked: BadgeId[] = BADGES.filter((badge) => !acted.badges.includes(badge.id))
    .filter((badge) => {
      const { current, target } = badgeProgress(acted, badge);
      return current >= target;
    })
    .map((badge) => badge.id);
  if (unlocked.length === 0) return { state: acted, events: [] };
  const at = new Date(now).toISOString();
  const badgeUnlockedAt = { ...acted.badgeUnlockedAt };
  for (const id of unlocked) badgeUnlockedAt[id] = at;
  return {
    state: { ...acted, badges: [...acted.badges, ...unlocked], badgeUnlockedAt },
    events: unlocked.map((badgeId) => ({ type: 'BADGE_UNLOCKED', badgeId })),
  };
}
