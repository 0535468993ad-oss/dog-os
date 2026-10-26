import { addDays, daysBetween } from '@/utils/date';

import { DEMOTION_PLACES, LEAGUE_RIVALS, LEAGUE_TIERS, PROMOTION_PLACES } from '../data/leagues';
import type { GameEvent, GameState, LeagueRow, LeagueStandings, LeagueZone } from '../types';
import { hashText, weekStartOf } from './questEngine';

// The weekly league against computer-generated rivals. Each rival's XP is deterministic – the same week,
// tier and user score give the same table on every device – and half of it tracks the user's own score,
// so the table stays close: rivals pass the user overnight, and a good session passes them back.

const TOP_TIER = LEAGUE_TIERS.length - 1;

/** The user's XP in a week, up to and including a day. */
export function weekXp(state: GameState, weekId: string, upTo: string): number {
  let total = 0;
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(weekId, i);
    if (day <= upTo) total += state.xpByDay[day] ?? 0;
  }
  return total;
}

/** How far into the week a day is, 1/7 on Sunday to 1 on Saturday. */
const weekProgress = (weekId: string, day: string) => Math.min(1, Math.max(1, daysBetween(weekId, day) + 1) / 7);

/** A rival's XP: half follows the user's score (×0.6–1.4), half is the tier's pace so far this week. */
export function rivalXp(rivalId: string, tier: number, weekId: string, userXp: number, progress: number): number {
  const seed = hashText(`${weekId}:${tier}:${rivalId}`);
  const follow = 0.6 + ((seed % 1000) / 1000) * 0.8;
  const pace = 0.6 + ((Math.floor(seed / 1000) % 1000) / 1000) * 0.8;
  const base = LEAGUE_TIERS[tier]?.rivalBaseXp ?? 0;
  return Math.round(0.5 * userXp * follow + 0.5 * base * pace * progress);
}

/** The sorted table for a week as of a day. Ties go to the user. */
function table(tier: number, weekId: string, userXp: number, progress: number, userNameHe: string): LeagueRow[] {
  const rows: LeagueRow[] = LEAGUE_RIVALS.map((rival) => ({ id: rival.id, nameHe: rival.nameHe, xp: rivalXp(rival.id, tier, weekId, userXp, progress), isUser: false }));
  rows.push({ id: 'user', nameHe: userNameHe, xp: userXp, isUser: true });
  return rows.sort((a, b) => b.xp - a.xp || Number(b.isUser) - Number(a.isUser));
}

/** Promotion, safe or demotion for a place in a tier. */
function zoneFor(rank: number, tier: number, size: number): LeagueZone {
  if (rank <= PROMOTION_PLACES && tier < TOP_TIER) return 'PROMOTION';
  if (rank > size - DEMOTION_PLACES && tier > 0) return 'DEMOTION';
  return 'SAFE';
}

/** This week's table for the user, with the rivals who passed them since yesterday. */
export function leagueStandings(state: GameState, today: string, userNameHe: string): LeagueStandings {
  const tier = state.league.tier;
  const weekId = weekStartOf(today);
  const rows = table(tier, weekId, weekXp(state, weekId, today), weekProgress(weekId, today), userNameHe);
  const userRank = rows.findIndex((row) => row.isUser) + 1;
  let overtakenBy: string[] = [];
  if (today > weekId) {
    const yesterday = addDays(today, -1);
    const before = table(tier, weekId, weekXp(state, weekId, yesterday), weekProgress(weekId, yesterday), userNameHe);
    const wasBelow = new Set(before.slice(before.findIndex((row) => row.isUser) + 1).map((row) => row.id));
    overtakenBy = rows.slice(0, userRank - 1).filter((row) => wasBelow.has(row.id)).map((row) => row.nameHe);
  }
  return { tier, rows, userRank, zone: zoneFor(userRank, tier, rows.length), overtakenBy };
}

/** Closes a finished week: moves the tier up or down by the final place, and starts the current week. */
export function settleLeague(state: GameState, today: string): { state: GameState; events: GameEvent[] } {
  const current = weekStartOf(today);
  const { tier, weekId } = state.league;
  if (weekId === current) return { state, events: [] };
  if (weekId === null || weekId > current) return { state: { ...state, league: { tier, weekId: current } }, events: [] };
  const final = table(tier, weekId, weekXp(state, weekId, addDays(weekId, 6)), 1, '');
  const zone = zoneFor(final.findIndex((row) => row.isUser) + 1, tier, final.length);
  const next = zone === 'PROMOTION' ? tier + 1 : zone === 'DEMOTION' ? tier - 1 : tier;
  return {
    state: { ...state, league: { tier: next, weekId: current } },
    events: next === tier ? [] : [{ type: 'LEAGUE_SETTLED', from: tier, to: next }],
  };
}
