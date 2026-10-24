import { addDays, computeStreak } from '@/utils/date';

import { RANKS } from '../data/ranksData';
import { STREAK_MULTIPLIERS } from '../data/rules';
import type { BadgeDefinition, GameState, RankTier } from '../types';

// Streaks, ranks and badge progress, all derived from the state. Days are calendar dates
// (YYYY-MM-DD) on the device, so a day turns over at local midnight.

/** Distinct calendar days with at least one completed session (including ones rolled off the log). */
export function activeDays(state: GameState): string[] {
  return [...new Set([...state.activeDays, ...state.sessions.map((session) => session.day)])].sort();
}

/** Consecutive training days ending today (or yesterday, so an unfinished today doesn't break it). */
export function streakFor(state: GameState, today: string): number {
  return computeStreak(activeDays(state), today);
}

/** The longest run of consecutive training days ever. */
export function longestStreak(state: GameState): number {
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of activeDays(state)) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

/** 1.5× from a 7-day streak, 1.2× from 3 days, otherwise 1×. */
export function multiplierFor(streak: number): number {
  return STREAK_MULTIPLIERS.find((tier) => streak >= tier.minDays)?.multiplier ?? 1;
}

/** The highest rank whose XP and distinct-day requirements are both met. */
export function rankFor(totalXp: number, activeDayCount: number): RankTier {
  const reached = RANKS.filter((rank) => totalXp >= rank.minXp && activeDayCount >= rank.minActiveDays);
  const rank = reached[reached.length - 1] ?? RANKS[0];
  if (!rank) throw new Error('The rank ladder is empty.');
  return rank;
}

/** The current rank of a state. */
export function levelOf(state: GameState): number {
  return rankFor(state.totalXp, activeDays(state).length).level;
}

/** The next rank and what is still missing for it, or null at the top. */
export function nextRankGap(totalXp: number, activeDayCount: number): { rank: RankTier; xpNeeded: number; daysNeeded: number } | null {
  const current = rankFor(totalXp, activeDayCount);
  const next = RANKS.find((rank) => rank.level === current.level + 1);
  if (!next) return null;
  return { rank: next, xpNeeded: Math.max(0, next.minXp - totalXp), daysNeeded: Math.max(0, next.minActiveDays - activeDayCount) };
}

/** Sessions of these commands (optionally only outdoors). */
function sessionCount(state: GameState, commandIds: readonly string[] | null, outdoorOnly = false): number {
  return state.sessions.filter(
    (session) => (commandIds === null || commandIds.includes(session.commandId)) && (!outdoorOnly || session.environment === 'OUTDOOR_STIMULI'),
  ).length;
}

/** How far a badge is towards its target (capped at the target). */
export function badgeProgress(state: GameState, badge: BadgeDefinition): { current: number; target: number } {
  const longest = longestStreak(state);
  const raw = (() => {
    switch (badge.id) {
      case 'toxin_shield':
        return (state.toxinReviewedAt > 0 ? 1 : 0) + Math.min(5, sessionCount(state, ['leave-it']));
      case 'recall_god':
        return sessionCount(state, ['recall']);
      case 'zen_master':
        // Every confirmed session is at least three live minutes, so one stay/place session is enough.
        return sessionCount(state, ['stay', 'place']);
      case 'street_fighter':
        return sessionCount(state, null, true);
      case 'flame_keeper_3':
      case 'flame_keeper_7':
      case 'flame_keeper_30':
        return longest;
    }
  })();
  return { current: Math.min(raw, badge.target), target: badge.target };
}
