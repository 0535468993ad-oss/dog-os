import { computeStreak } from '@/utils/date';

import { LEVELS, STREAK_MULTIPLIERS, TROPHIES } from '../data/gameRules';
import type { GameState, Level, TrophyId } from '../types';

/** Distinct calendar days with at least one completed session (including ones rolled off the log). */
export function activeDays(state: GameState): string[] {
  return [...new Set([...state.activeDays, ...state.sessions.map((session) => session.day)])].sort();
}

/** Consecutive training days ending today (or yesterday). */
export function streakFor(state: GameState, today: string): number {
  return computeStreak(activeDays(state), today);
}

/** 1.5× from a 7-day streak, 1.2× from 3 days, otherwise 1×. */
export function multiplierFor(streak: number): number {
  return STREAK_MULTIPLIERS.find((tier) => streak >= tier.minDays)?.multiplier ?? 1;
}

/** The highest level whose XP and distinct-day requirements are both met. */
export function levelFor(totalXp: number, activeDayCount: number): Level {
  const reached = LEVELS.filter((level) => totalXp >= level.minXp && activeDayCount >= level.minActiveDays);
  return reached[reached.length - 1] ?? LEVELS[0] ?? { level: 1, titleHe: '', minXp: 0, minActiveDays: 0 };
}

/** The next level and what is still missing for it, or null at the top. */
export function nextLevelGap(totalXp: number, activeDayCount: number): { level: Level; xpNeeded: number; daysNeeded: number } | null {
  const current = levelFor(totalXp, activeDayCount);
  const next = LEVELS.find((level) => level.level === current.level + 1);
  if (!next) return null;
  return { level: next, xpNeeded: Math.max(0, next.minXp - totalXp), daysNeeded: Math.max(0, next.minActiveDays - activeDayCount) };
}

/** Number of sessions matching a filter. */
const count = (state: GameState, match: (session: GameState['sessions'][number]) => boolean) => state.sessions.filter(match).length;

/** Every trophy whose criteria the state meets (earned trophies are kept even if old sessions roll off). */
export function earnedTrophies(state: GameState, today: string): TrophyId[] {
  const earned = new Set<TrophyId>(state.trophies);
  if (streakFor(state, today) >= 7) earned.add('iron-shield');
  const recalls = count(state, (session) => session.commandId === 'recall');
  const outdoorRecalls = count(state, (session) => session.commandId === 'recall' && session.environment === 'OUTDOOR_STIMULI');
  if (recalls >= 10 && outdoorRecalls >= 3) earned.add('recall-magnet');
  if ((['stay', 'heel', 'leave-it'] as const).every((id) => count(state, (session) => session.commandId === id) >= 5)) earned.add('steel-control');
  const outdoor = state.sessions.filter((session) => session.environment === 'OUTDOOR_STIMULI');
  if (outdoor.length >= 15 && new Set(outdoor.map((session) => session.commandId)).size >= 5) earned.add('field-beast');
  return (Object.keys(TROPHIES) as TrophyId[]).filter((id) => earned.has(id));
}
