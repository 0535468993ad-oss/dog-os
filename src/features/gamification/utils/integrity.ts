import { FREEZE_MS, MAX_STORED_SESSIONS, OUTDOOR_SESSION_XP, RAPID_MAX_ACTIONS, RAPID_WINDOW_MS, SESSION_MIN_SECONDS, STEP_XP } from '../data/rules';
import { awardXp, checkBadgeProgress } from '../services/gamificationEngine';
import type { CompletionInput, CompletionOutcome, GameState, SessionRecord, StepCheckInput, StepOutcome } from '../types';
import { levelOf } from './progression';

// Anti-cheat and the session pipeline. Every check runs here, on the state, not only in the UI: a
// disabled button can be bypassed, a rule in the reducer cannot.

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

/** Steps of this live session that are banked for its confirmation. */
function bankedSteps(state: GameState, commandId: string, sessionStartedAt: number): number[] {
  const awards = state.stepAwards;
  return awards && awards.commandId === commandId && awards.sessionStartedAt === sessionStartedAt ? awards.steps : [];
}

/**
 * Ticks a protocol step during a live session. Its STEP_XP is banked, not paid: the session pays it
 * on confirmation, so step XP is bound by the same three-minute lock and daily cap as the session.
 */
export function checkStep(state: GameState, input: StepCheckInput): StepOutcome {
  const { commandId, stepIndex, stepCount, sessionStartedAt, now } = input;
  if (sessionStartedAt === null) return { state, bankedXp: 0, refused: 'NO_LIVE_SESSION' };
  const banked = bankedSteps(state, commandId, sessionStartedAt);
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= stepCount) return { state, bankedXp: banked.length * STEP_XP, refused: 'INVALID_STEP' };
  const wasFrozen = isFrozen(state, now);
  const action = registerAction(state, now);
  const refuse = (refused: StepOutcome['refused']): StepOutcome => ({ state: action.state, bankedXp: banked.length * STEP_XP, refused });
  if (wasFrozen) return refuse('FROZEN');
  if (action.tripped) return refuse('RAPID_ACTIONS');
  if (banked.includes(stepIndex)) return refuse('ALREADY_AWARDED');
  const steps = [...banked, stepIndex];
  return { state: { ...action.state, stepAwards: { sessionStartedAt, commandId, steps } }, bankedXp: steps.length * STEP_XP };
}

/** Confirms a command session: integrity checks, then XP (multiplier, cap, level-up) and badges. */
export function completeSession(state: GameState, input: CompletionInput): CompletionOutcome {
  const levelBefore = levelOf(state);
  const refused = (next: GameState, blocked: CompletionOutcome['blocked']): CompletionOutcome => ({
    state: next,
    xpAwarded: 0,
    capped: false,
    multiplier: 1,
    levelBefore,
    levelAfter: levelBefore,
    events: [],
    blocked,
  });

  const wasFrozen = isFrozen(state, input.now);
  const action = registerAction(state, input.now);
  if (wasFrozen) return refused(action.state, 'FROZEN');
  if (action.tripped) return refused(action.state, 'RAPID_ACTIONS');
  if (!canConfirmSession(input.startedAt, input.now)) return refused(action.state, 'SESSION_TOO_SHORT');

  // One award for the session and its banked steps, so the multiplier and the cap treat them alike.
  const sessionXp = input.environment === 'OUTDOOR_STIMULI' ? OUTDOOR_SESSION_XP : input.xpReward;
  const amount = sessionXp + bankedSteps(state, input.commandId, input.startedAt).length * STEP_XP;
  const award = awardXp(action.state, { amount, reason: `session:${input.commandId}`, now: input.now, today: input.today });
  const session: SessionRecord = { commandId: input.commandId, track: input.track, environment: input.environment, day: input.today, at: input.now, xp: award.awarded };
  const logged = { ...award.state, stepAwards: null, sessions: [...award.state.sessions, session].slice(-MAX_STORED_SESSIONS) };
  const badges = checkBadgeProgress(logged, { type: 'SESSION_COMPLETED', commandId: input.commandId, environment: input.environment }, input.now);

  return {
    state: badges.state,
    xpAwarded: award.awarded,
    capped: award.capped,
    multiplier: award.multiplier,
    levelBefore,
    levelAfter: levelOf(badges.state),
    events: [...award.events, ...badges.events],
  };
}
