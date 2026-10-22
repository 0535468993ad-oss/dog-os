import { BASE_SESSION_XP, DAILY_XP_CAP, FREEZE_MS, MAX_STORED_SESSIONS, OUTDOOR_BONUS_XP, RAPID_MAX_ACTIONS, RAPID_WINDOW_MS, SESSION_MIN_SECONDS } from '../data/gameRules';
import type { CompletionInput, CompletionOutcome, GameState, SessionRecord } from '../types';
import { activeDays, earnedTrophies, levelFor, multiplierFor, streakFor } from './progression';

// Anti-cheat and scoring. Every check runs here, on the state, not only in the UI: a disabled button
// can be bypassed, a rule in the reducer cannot.

/** Whole seconds a live session has been running. */
export function elapsedSeconds(startedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

/** Whether a session has run long enough to be confirmed. */
export function canConfirmSession(startedAt: number | null, now: number): boolean {
  return startedAt !== null && elapsedSeconds(startedAt, now) >= SESSION_MIN_SECONDS;
}

/** Whether scoring is currently frozen by the rapid-action defence. */
export function isFrozen(state: GameState, now: number): boolean {
  return now < state.frozenUntil;
}

/** Logs one user action; more than RAPID_MAX_ACTIONS inside RAPID_WINDOW_MS freezes scoring. */
export function registerAction(state: GameState, now: number): { state: GameState; tripped: boolean } {
  const actionLog = [...state.actionLog.filter((at) => now - at < RAPID_WINDOW_MS), now];
  const tripped = actionLog.length > RAPID_MAX_ACTIONS;
  return { state: { ...state, actionLog, frozenUntil: tripped ? now + FREEZE_MS : state.frozenUntil }, tripped };
}

/** Confirms a command session: integrity checks, streak multiplier, daily cap, level and trophies. */
export function completeSession(state: GameState, input: CompletionInput): CompletionOutcome {
  const dayCount = activeDays(state).length;
  const levelBefore = levelFor(state.totalXp, dayCount).level;
  const refused = (next: GameState, blocked: CompletionOutcome['blocked']): CompletionOutcome => ({
    state: next,
    xpAwarded: 0,
    capped: false,
    multiplier: 1,
    levelBefore,
    levelAfter: levelBefore,
    newTrophies: [],
    blocked,
  });

  const wasFrozen = isFrozen(state, input.now);
  const action = registerAction(state, input.now);
  if (wasFrozen) return refused(action.state, 'FROZEN');
  if (action.tripped) return refused(action.state, 'RAPID_ACTIONS');
  if (!canConfirmSession(input.startedAt, input.now)) return refused(action.state, 'SESSION_TOO_SHORT');

  const session: SessionRecord = { commandId: input.commandId, track: input.track, environment: input.environment, day: input.today, at: input.now, xp: 0 };
  // Today counts towards the streak as soon as this session is in.
  const streak = streakFor({ ...state, sessions: [...state.sessions, session] }, input.today);
  const multiplier = multiplierFor(streak);
  const raw = Math.round((BASE_SESSION_XP + (input.environment === 'OUTDOOR_STIMULI' ? OUTDOOR_BONUS_XP : 0)) * multiplier);
  const earnedToday = action.state.xpByDay[input.today] ?? 0;
  const xpAwarded = Math.min(raw, Math.max(0, DAILY_XP_CAP - earnedToday));

  const scored: GameState = {
    ...action.state,
    totalXp: action.state.totalXp + xpAwarded,
    xpByDay: { ...action.state.xpByDay, [input.today]: earnedToday + xpAwarded },
    sessions: [...action.state.sessions, { ...session, xp: xpAwarded }].slice(-MAX_STORED_SESSIONS),
    activeDays: action.state.activeDays.includes(input.today) ? action.state.activeDays : [...action.state.activeDays, input.today].sort(),
  };
  const trophies = earnedTrophies(scored, input.today);
  const next = { ...scored, trophies };

  return {
    state: next,
    xpAwarded,
    capped: xpAwarded < raw,
    multiplier,
    levelBefore,
    levelAfter: levelFor(next.totalXp, activeDays(next).length).level,
    newTrophies: trophies.filter((id) => !state.trophies.includes(id)),
  };
}
