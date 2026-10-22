// Anti-cheat and progression: the live-session lock, the daily cap, the rapid-action freeze, streak
// multipliers, distinct-day level gates, trophies, and tolerant parsing of stored state.
import { addDays } from '@/utils/date';

import type { CompletionInput, GameState, MasterCommandId, SessionRecord } from '../types';
import { EMPTY_GAME_STATE, parseGameState } from '../utils/gameState';
import { completeSession, registerAction } from '../utils/integrity';
import { earnedTrophies, levelFor, multiplierFor, streakFor } from '../utils/progression';

const TODAY = '2026-10-22';
const NOON = Date.parse('2026-10-22T12:00:00Z');
const MIN = 60_000;

/** A completion that ran `seconds` long, finishing at `now`. */
function input(now: number, seconds = 180, overrides: Partial<CompletionInput> = {}): CompletionInput {
  return { commandId: 'sit', track: 'FORCE_FREE', environment: 'HOME_QUIET', startedAt: now - seconds * 1000, now, today: TODAY, ...overrides };
}

/** Past sessions on the given days. */
function withDays(days: string[], commandId: MasterCommandId = 'sit', environment: SessionRecord['environment'] = 'HOME_QUIET'): GameState {
  return { ...EMPTY_GAME_STATE, sessions: days.map((day, i) => ({ commandId, track: 'FORCE_FREE', environment, day, at: i, xp: 40 })) };
}

describe('live session timer', () => {
  it('refuses a session shorter than 180 seconds and accepts one at 180', () => {
    expect(completeSession(EMPTY_GAME_STATE, input(NOON, 179)).blocked).toBe('SESSION_TOO_SHORT');
    const ok = completeSession(EMPTY_GAME_STATE, input(NOON, 180));
    expect(ok.blocked).toBeUndefined();
    expect(ok.xpAwarded).toBe(40);
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
    expect(state.frozenUntil).toBeGreaterThan(NOON);

    expect(completeSession(state, input(NOON + 5000)).blocked).toBe('FROZEN');
    expect(completeSession(state, input(NOON + 5 * MIN)).blocked).toBeUndefined();
  });

  it('lets actions spaced beyond the window through', () => {
    let state = EMPTY_GAME_STATE;
    for (let i = 0; i < 6; i += 1) {
      const result = registerAction(state, NOON + i * 16_000);
      expect(result.tripped).toBe(false);
      state = result.state;
    }
  });
});

describe('streak multipliers', () => {
  it('applies 1× under 3 days, 1.2× from 3 and 1.5× from 7', () => {
    expect([1, 2, 3, 6, 7, 30].map(multiplierFor)).toEqual([1, 1, 1.2, 1.2, 1.5, 1.5]);
  });

  it('counts today once its session is in', () => {
    const twoBefore = withDays([addDays(TODAY, -2), addDays(TODAY, -1)]);
    const outcome = completeSession(twoBefore, input(NOON));
    expect(outcome.multiplier).toBe(1.2);
    expect(outcome.xpAwarded).toBe(48);
    expect(streakFor(outcome.state, TODAY)).toBe(3);
  });
});

describe('levels', () => {
  it('requires distinct training days from level 4', () => {
    expect(levelFor(600, 1).level).toBe(3);
    expect(levelFor(600, 3).level).toBe(4);
    expect(levelFor(5000, 29).level).toBe(9);
    expect(levelFor(5000, 30).level).toBe(10);
  });
});

describe('trophies', () => {
  it('awards the four trophies on their criteria', () => {
    const week = Array.from({ length: 7 }, (_, i) => addDays(TODAY, -i));
    expect(earnedTrophies(withDays(week), TODAY)).toContain('iron-shield');

    const recalls = [...withDays(Array(7).fill(TODAY), 'recall').sessions, ...withDays(Array(3).fill(TODAY), 'recall', 'OUTDOOR_STIMULI').sessions];
    expect(earnedTrophies({ ...EMPTY_GAME_STATE, sessions: recalls }, TODAY)).toContain('recall-magnet');

    const control = (['stay', 'heel', 'leave-it'] as const).flatMap((id) => withDays(Array(5).fill(TODAY), id).sessions);
    expect(earnedTrophies({ ...EMPTY_GAME_STATE, sessions: control }, TODAY)).toEqual(['steel-control']);

    const field = (['sit', 'down', 'recall', 'heel', 'place'] as const).flatMap((id) => withDays(Array(3).fill(TODAY), id, 'OUTDOOR_STIMULI').sessions);
    expect(earnedTrophies({ ...EMPTY_GAME_STATE, sessions: field }, TODAY)).toContain('field-beast');
  });

  it('reports a newly earned trophy once', () => {
    const almost = withDays(Array(9).fill(TODAY), 'recall', 'OUTDOOR_STIMULI');
    const outcome = completeSession(almost, input(NOON, 180, { commandId: 'recall' }));
    expect(outcome.newTrophies).toEqual(['recall-magnet']);
    expect(completeSession(outcome.state, input(NOON + 10 * MIN, 180, { commandId: 'recall' })).newTrophies).toEqual([]);
  });
});

describe('stored state', () => {
  it('falls back to a clean state for garbage, and drops invalid fields', () => {
    expect(parseGameState(null)).toEqual(EMPTY_GAME_STATE);
    expect(parseGameState({ version: 2 })).toEqual(EMPTY_GAME_STATE);
    const parsed = parseGameState({
      version: 1,
      totalXp: -5,
      sessions: [{ commandId: 'fly', track: 'FORCE_FREE', environment: 'HOME_QUIET', day: TODAY, at: 1, xp: 40 }],
      trophies: ['iron-shield', 'gold-medal'],
      temperament: 'DOMINANT',
      trackByCommand: { sit: 'BALANCED', jump: 'BALANCED', down: 'SHOCK' },
    });
    expect(parsed).toMatchObject({ totalXp: 0, sessions: [], trophies: ['iron-shield'], temperament: null, trackByCommand: { sit: 'BALANCED' } });
  });
});
