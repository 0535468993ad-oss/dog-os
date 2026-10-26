// The retention engines: quests and the weekly boss, the streak rescue, freeze shields, loot boxes with
// the pity timer, the combo arena's anti-spam gate, mastery stars, vitality and the simulated league.
import { LEAGUE_RIVALS } from '../data/leagues';
import { DAILY_XP_CAP, LOOT_PITY_THRESHOLD, REP_MIN_INTERVAL_MS, REP_SESSION_MAX_XP } from '../data/rules';
import { leagueStandings, rivalXp, settleLeague } from '../services/leagueEngine';
import { openLootBox, rollTier } from '../services/lootBoxEngine';
import { questBonusApplies, questFor, rescueAvailable, weekStartOf, weeklyBossCommand } from '../services/questEngine';
import { applyStreakShields } from '../services/streakShield';
import { computeVitality } from '../services/vitalityEngine';
import type { CompletionInput, GameState } from '../types';
import { comboMultiplier } from '../utils/combo';
import { EMPTY_GAME_STATE, parseGameState } from '../utils/gameState';
import { completeSession, logRep, logStruggle } from '../utils/integrity';
import { starsFor } from '../utils/mastery';
import { streakFor } from '../utils/progression';

const TODAY = '2026-10-22'; // a Thursday
const NOON = Date.parse('2026-10-22T12:00:00Z');
const state = (patch: Partial<GameState> = {}): GameState => ({ ...EMPTY_GAME_STATE, ...patch });
const input = (patch: Partial<CompletionInput> = {}): CompletionInput => ({
  commandId: 'down', xpReward: 100, track: 'FORCE_FREE', balancedAccess: 'GRANTED', environment: 'HOME_QUIET', startedAt: NOON - 180_000, now: NOON, today: TODAY, hour: 3, mode: 'STANDARD', ...patch,
});
/** A fixed sequence of "random" numbers. */
const sequence = (...values: number[]) => () => values.shift() ?? 0;

describe('quests and the weekly boss', () => {
  it('runs the morning, afternoon and rescue quests by hour', () => {
    expect(questFor(7, 0)?.id).toBe('MORNING_PATROL');
    expect(questFor(15, 50)?.id).toBe('IMPULSE_CONTROL');
    expect(questFor(21, 0)?.id).toBe('STREAK_RESCUE');
    expect(questFor(21, 10)).toBeNull();
    expect(questFor(3, 0)).toBeNull();
    expect(questBonusApplies('heel', 8, 0)).toBe(true);
    expect(questBonusApplies('recall', 8, 0)).toBe(false);
  });

  it('pays +20% on a quest command and records the bonus', () => {
    const outcome = completeSession(state(), input({ commandId: 'sit', hour: 8 }));
    expect(outcome.bonuses).toContain('QUEST');
  });

  it('starts weeks on Sunday and pays the boss double once a week', () => {
    expect(weekStartOf(TODAY)).toBe('2026-10-18');
    const boss = weeklyBossCommand(weekStartOf(TODAY));
    const first = completeSession(state(), input({ commandId: boss }));
    expect(first.bonuses).toContain('WEEKLY_BOSS');
    const second = completeSession(first.state, input({ commandId: boss, startedAt: NOON, now: NOON + 200_000 }));
    expect(second.bonuses).not.toContain('WEEKLY_BOSS');
  });
});

describe('the streak rescue', () => {
  it('confirms the touch drill after 60 seconds, only in the evening on an empty day', () => {
    expect(rescueAvailable(state(), 'touch', TODAY, 21)).toBe(true);
    expect(rescueAvailable(state(), 'sit', TODAY, 21)).toBe(false);
    expect(rescueAvailable(state({ xpByDay: { [TODAY]: 10 } }), 'touch', TODAY, 21)).toBe(false);
    const rescue = input({ commandId: 'touch', mode: 'STREAK_RESCUE', hour: 21, startedAt: NOON - 60_000 });
    const outcome = completeSession(state(), rescue);
    expect(outcome.blocked).toBeUndefined();
    expect(outcome.xpAwarded).toBe(30);
    expect(outcome.state.loot.pendingBoxes).toBe(0);
    expect(completeSession(state(), { ...rescue, hour: 15 }).blocked).toBe('RESCUE_NOT_AVAILABLE');
    expect(completeSession(state(), { ...rescue, startedAt: NOON - 30_000 }).blocked).toBe('SESSION_TOO_SHORT');
  });
});

describe('streak freeze shields', () => {
  it('covers a missed day and keeps the streak', () => {
    const before = state({ activeDays: ['2026-10-19', '2026-10-20'], streakShields: 2 });
    const { state: after, usedDays } = applyStreakShields(before, TODAY);
    expect(usedDays).toEqual(['2026-10-21']);
    expect(after.streakShields).toBe(1);
    expect(streakFor(after, TODAY)).toBe(3);
  });

  it('keeps the shields when the gap is wider than the reserve', () => {
    const before = state({ activeDays: ['2026-10-15'], streakShields: 1 });
    expect(applyStreakShields(before, TODAY).usedDays).toEqual([]);
  });
});

describe('loot boxes', () => {
  it('rolls 60/30/10 and forces rare-or-better after four commons', () => {
    expect(rollTier(0, () => 0.1)).toBe('COMMON');
    expect(rollTier(0, () => 0.7)).toBe('RARE');
    expect(rollTier(0, () => 0.95)).toBe('LEGENDARY');
    expect(rollTier(LOOT_PITY_THRESHOLD, () => 0.1)).not.toBe('COMMON');
  });

  it('pays common XP through the daily cap and counts the pity timer', () => {
    const capped = state({ loot: { ...EMPTY_GAME_STATE.loot, pendingBoxes: 1 }, xpByDay: { [TODAY]: DAILY_XP_CAP }, activeDays: [TODAY] });
    const result = openLootBox(capped, sequence(0.1, 0.5, 0.5), NOON, TODAY);
    expect(result.reward).toMatchObject({ tier: 'COMMON', xpAwarded: 0 });
    expect(result.state.loot).toMatchObject({ pendingBoxes: 0, boxesSinceLastRare: 1 });
    expect(openLootBox(result.state, Math.random, NOON, TODAY).refused).toBe('NO_BOX');
  });

  it('turns a legendary into a shield until the reserve is full', () => {
    const one = state({ loot: { ...EMPTY_GAME_STATE.loot, pendingBoxes: 1 } });
    expect(openLootBox(one, () => 0.99, NOON, TODAY).state.streakShields).toBe(1);
    const full = { ...one, streakShields: 3 };
    expect(openLootBox(full, () => 0.99, NOON, TODAY).reward).toMatchObject({ tier: 'LEGENDARY', kind: 'TITLE' });
  });
});

describe('the combo arena', () => {
  it('counts reps four seconds apart and escalates the combo', () => {
    let current = state();
    for (let i = 0; i < 8; i += 1) current = logRep(current, { commandId: 'sit', sessionStartedAt: NOON, now: NOON + i * REP_MIN_INTERVAL_MS }).state;
    expect(current.repAwards).toMatchObject({ reps: 8, combo: 8 });
    expect(comboMultiplier(8)).toBe(5);
    expect(current.repAwards?.bankedXp).toBeLessThanOrEqual(REP_SESSION_MAX_XP);
    expect(logStruggle(current, 'sit', NOON).repAwards).toMatchObject({ reps: 8, combo: 0 });
  });

  it('refuses spam taps and freezes scoring after more than three inside 15 seconds', () => {
    let current = logRep(state(), { commandId: 'sit', sessionStartedAt: NOON, now: NOON }).state;
    const refusals = [1, 2, 3, 4].map((i) => {
      const outcome = logRep(current, { commandId: 'sit', sessionStartedAt: NOON, now: NOON + i * 500 });
      current = outcome.state;
      return outcome.refused;
    });
    expect(refusals).toEqual(['TOO_SOON', 'TOO_SOON', 'TOO_SOON', 'RAPID_ACTIONS']);
    expect(current.frozenUntil).toBeGreaterThan(NOON);
  });

  it('pays banked rep XP on confirmation', () => {
    const repped = logRep(state(), { commandId: 'down', sessionStartedAt: NOON - 180_000, now: NOON - 100_000 }).state;
    const plain = completeSession(state(), input()).xpAwarded;
    expect(completeSession(repped, input()).xpAwarded).toBe(plain + 5);
  });
});

describe('mastery stars', () => {
  it('earns stars in order: home, yard, street', () => {
    const home = completeSession(state(), input());
    expect(starsFor(home.state, 'down')).toBe(1);
    expect(home.events).toContainEqual({ type: 'STAR_EARNED', commandId: 'down', stars: 1 });
    const street = completeSession(state(), input({ environment: 'OUTDOOR_STIMULI' }));
    expect(starsFor(street.state, 'down')).toBe(0);
    const yard = completeSession(home.state, input({ environment: 'YARD_LOW_DISTRACTION', startedAt: NOON, now: NOON + 200_000 }));
    expect(starsFor(yard.state, 'down')).toBe(2);
  });

  it('survives a round trip through storage', () => {
    const done = completeSession(state(), input()).state;
    expect(parseGameState(JSON.parse(JSON.stringify(done)))).toMatchObject({ mastery: done.mastery, loot: done.loot });
  });
});

describe('vitality', () => {
  it('starts at zero and decays sharpness 15 points a day', () => {
    expect(computeVitality(state(), NOON, TODAY).meters.sharpness).toBe(0);
    const trained = completeSession(state(), input()).state;
    expect(computeVitality(trained, NOON, TODAY).meters.sharpness).toBe(100);
    expect(computeVitality(trained, NOON + 2 * 86_400_000, '2026-10-24').meters.sharpness).toBe(70);
  });
});

describe('the weekly league', () => {
  it('is deterministic and follows the user', () => {
    expect(rivalXp('rocky', 0, '2026-10-18', 200, 0.5)).toBe(rivalXp('rocky', 0, '2026-10-18', 200, 0.5));
    expect(rivalXp('rocky', 0, '2026-10-18', 400, 0.5)).toBeGreaterThan(rivalXp('rocky', 0, '2026-10-18', 0, 0.5));
    const table = leagueStandings(state(), TODAY, 'אתם');
    expect(table.rows).toHaveLength(LEAGUE_RIVALS.length + 1);
    expect(table.userRank).toBe(table.rows.length);
  });

  it('promotes a strong week and starts the next one', () => {
    const xpByDay = Object.fromEntries(['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17'].map((day) => [day, 300]));
    const settled = settleLeague(state({ xpByDay, league: { tier: 0, weekId: '2026-10-11' } }), TODAY);
    expect(settled.state.league).toEqual({ tier: 1, weekId: '2026-10-18' });
    expect(settled.events).toEqual([{ type: 'LEAGUE_SETTLED', from: 0, to: 1 }]);
  });
});
