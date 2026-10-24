// Anti-cheat and progression: the live-session lock, the daily cap, the rapid-action freeze, streak
// multipliers, distinct-day rank gates, and tolerant parsing of stored state (old format included).
import { addDays } from '@/utils/date';

import { COMMAND_XP, DAILY_XP_CAP, OUTDOOR_SESSION_XP, STEP_XP } from '../data/rules';
import type { CompletionInput, GameState, SessionRecord } from '../types';
import { EMPTY_GAME_STATE, parseGameState } from '../utils/gameState';
import { checkStep, completeSession, registerAction } from '../utils/integrity';
import { longestStreak, multiplierFor, rankFor, streakFor } from '../utils/progression';

const TODAY = '2026-10-22';
const NOON = Date.parse('2026-10-22T12:00:00Z');
const MIN = 60_000;

/** A completion that ran `seconds` long, finishing at `now`. */
function input(now: number, seconds = 180, overrides: Partial<CompletionInput> = {}): CompletionInput {
  return { commandId: 'sit', xpReward: 40, track: 'FORCE_FREE', environment: 'HOME_QUIET', startedAt: now - seconds * 1000, now, today: TODAY, ...overrides };
}

/** Past sessions on the given days. */
function withDays(days: string[], commandId = 'sit', environment: SessionRecord['environment'] = 'HOME_QUIET'): GameState {
  return { ...EMPTY_GAME_STATE, sessions: days.map((day, i) => ({ commandId, track: 'FORCE_FREE', environment, day, at: i, xp: 40 })) };
}

describe('live session timer', () => {
  it('refuses a session shorter than 180 seconds and accepts one at 180', () => {
    expect(completeSession(EMPTY_GAME_STATE, input(NOON, 179)).blocked).toBe('SESSION_TOO_SHORT');
    const ok = completeSession(EMPTY_GAME_STATE, input(NOON, 180));
    expect(ok.blocked).toBeUndefined();
    expect(ok.xpAwarded).toBe(40);
  });

  it('pays COMMAND_XP at home and OUTDOOR_SESSION_XP outside', () => {
    expect(completeSession(EMPTY_GAME_STATE, input(NOON, 180, { xpReward: COMMAND_XP })).xpAwarded).toBe(100);
    expect(completeSession(EMPTY_GAME_STATE, input(NOON, 180, { xpReward: COMMAND_XP, environment: 'OUTDOOR_STIMULI' })).xpAwarded).toBe(OUTDOOR_SESSION_XP);
  });
});

describe('step XP', () => {
  const started = NOON - 180_000;
  /** Ticks step `stepIndex` of `sit` (5 steps) at `now`. */
  const tick = (state: GameState, stepIndex: number, now: number, sessionStartedAt: number | null = started) =>
    checkStep(state, { commandId: 'sit', stepIndex, stepCount: 5, sessionStartedAt, now });

  it('banks 25 XP per step during a live session, once per step, and pays it on confirmation', () => {
    const one = tick(EMPTY_GAME_STATE, 0, started + 10_000);
    const two = tick(one.state, 1, started + 40_000);
    const again = tick(two.state, 1, started + 70_000);
    expect([one.bankedXp, two.bankedXp, again.bankedXp]).toEqual([STEP_XP, 2 * STEP_XP, 2 * STEP_XP]);
    expect(again.refused).toBe('ALREADY_AWARDED');
    // Banked, not paid: no XP until the session is confirmed.
    expect(again.state.totalXp).toBe(0);
    const done = completeSession(again.state, input(NOON, 180, { xpReward: COMMAND_XP }));
    expect(done.xpAwarded).toBe(COMMAND_XP + 2 * STEP_XP);
    expect(done.state.stepAwards).toBeNull();
  });

  it('pays nothing for steps without a live session, outside the protocol, or before the 180-second lock', () => {
    expect(tick(EMPTY_GAME_STATE, 0, NOON, null).refused).toBe('NO_LIVE_SESSION');
    expect(tick(EMPTY_GAME_STATE, 5, NOON).refused).toBe('INVALID_STEP');
    const banked = tick(EMPTY_GAME_STATE, 0, started + 10_000).state;
    const early = completeSession(banked, input(NOON - 60_000, 120));
    expect(early.blocked).toBe('SESSION_TOO_SHORT');
    expect(early.state.totalXp).toBe(0);
  });

  it('does not pay steps banked in a different session', () => {
    const banked = tick(EMPTY_GAME_STATE, 0, started + 10_000).state;
    expect(completeSession(banked, input(NOON, 200, { xpReward: COMMAND_XP })).xpAwarded).toBe(COMMAND_XP);
  });

  it('freezes a burst of step ticks like any rapid action', () => {
    let state = EMPTY_GAME_STATE;
    const refusals = [0, 1, 2, 3].map((step) => {
      const outcome = tick(state, step, started + step * 1000);
      state = outcome.state;
      return outcome.refused;
    });
    expect(refusals).toEqual([undefined, undefined, undefined, 'RAPID_ACTIONS']);
    expect(tick(state, 4, started + 10_000).refused).toBe('FROZEN');
  });

  it('keeps a full day of sessions and steps within the 300 XP cap, multiplier included', () => {
    const streak = withDays(Array.from({ length: 7 }, (_, i) => addDays(TODAY, -(i + 1))));
    let state = tick(tick(streak, 0, started + 10_000).state, 1, started + 40_000).state;
    const first = completeSession(state, input(NOON, 180, { xpReward: COMMAND_XP, environment: 'OUTDOOR_STIMULI' }));
    expect(first.multiplier).toBe(1.5);
    expect(first.xpAwarded).toBe(Math.round((OUTDOOR_SESSION_XP + 2 * STEP_XP) * 1.5));
    state = completeSession(first.state, input(NOON + 4 * MIN, 180, { xpReward: COMMAND_XP })).state;
    expect(state.xpByDay[TODAY]).toBe(DAILY_XP_CAP);
  });
});

describe('daily XP cap', () => {
  it('never awards more than 300 XP on one calendar day', () => {
    let state = EMPTY_GAME_STATE;
    const awards: number[] = [];
    for (let i = 0; i < 9; i += 1) {
      const outcome = completeSession(state, input(NOON + i * 4 * MIN, 180, { environment: 'OUTDOOR_STIMULI' }));
      state = outcome.state;
      awards.push(outcome.xpAwarded);
    }
    expect(state.xpByDay[TODAY]).toBe(300);
    expect(awards.reduce((a, b) => a + b, 0)).toBe(300);
    expect(awards[awards.length - 1]).toBe(0);
    expect(state.sessions).toHaveLength(9);
  });
});

describe('rapid-action defence', () => {
  it('freezes scoring after more than 3 actions in 15 seconds', () => {
    let state = EMPTY_GAME_STATE;
    const tripped: boolean[] = [];
    for (let i = 0; i < 4; i += 1) {
      const result = registerAction(state, NOON + i * 1000);
      state = result.state;
      tripped.push(result.tripped);
    }
    expect(tripped).toEqual([false, false, false, true]);
    expect(completeSession(state, input(NOON + 5000)).blocked).toBe('FROZEN');
    expect(completeSession(state, input(NOON + 5 * MIN)).blocked).toBeUndefined();
  });
});

describe('streaks and ranks', () => {
  it('applies 1× under 3 days, 1.2× from 3 and 1.5× from 7', () => {
    expect([1, 2, 3, 6, 7, 30].map(multiplierFor)).toEqual([1, 1, 1.2, 1.2, 1.5, 1.5]);
  });

  it('counts today once its session is in', () => {
    const outcome = completeSession(withDays([addDays(TODAY, -2), addDays(TODAY, -1)]), input(NOON));
    expect(outcome.multiplier).toBe(1.2);
    expect(outcome.xpAwarded).toBe(48);
    expect(streakFor(outcome.state, TODAY)).toBe(3);
  });

  it('tracks the longest streak across gaps', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10', '2026-10-11'];
    expect(longestStreak(withDays(days))).toBe(3);
  });

  it('requires distinct training days from rank 4', () => {
    expect(rankFor(600, 1).level).toBe(3);
    expect(rankFor(600, 3).level).toBe(4);
    expect(rankFor(5000, 29).level).toBe(9);
    expect(rankFor(5000, 30).level).toBe(10);
  });
});

describe('stored state', () => {
  it('falls back to a clean state for garbage, and drops invalid fields', () => {
    expect(parseGameState(null)).toEqual(EMPTY_GAME_STATE);
    const parsed = parseGameState({
      version: 1,
      totalXp: -5,
      sessions: [{ commandId: 'FLY!', track: 'FORCE_FREE', environment: 'HOME_QUIET', day: TODAY, at: 1, xp: 40 }],
      badges: ['recall_god', 'gold-medal'],
      claimedRewards: ['whistle', 'free-money'],
      preferences: { temperament: 'HIGH_AROUSAL_PREY', trackByCommand: { sit: 'BALANCED', down: 'SHOCK' } },
    });
    expect(parsed).toMatchObject({ totalXp: 0, sessions: [], badges: ['recall_god'], claimedRewards: ['whistle'] });
    expect(parsed.preferences).toEqual({ temperament: 'HIGH_AROUSAL_PREY', trackByCommand: { sit: 'BALANCED' }, balancedAcknowledged: false });
  });

  it('reads the earlier training-only format (flat preferences)', () => {
    const parsed = parseGameState({ version: 1, totalXp: 120, temperament: 'STEADY', balancedAcknowledged: true, trophies: ['iron-shield'] });
    expect(parsed.totalXp).toBe(120);
    expect(parsed.preferences).toMatchObject({ temperament: 'STEADY', balancedAcknowledged: true });
    expect(parsed.badges).toEqual([]);
  });
});
