import {
  BOSS_MULTIPLIER,
  COMBO_RESET_MS,
  FREEZE_MS,
  MAX_STORED_SESSIONS,
  OUTDOOR_SESSION_XP,
  QUEST_BONUS_MULTIPLIER,
  RAPID_MAX_ACTIONS,
  RAPID_WINDOW_MS,
  REP_MIN_INTERVAL_MS,
  REP_SESSION_MAX_XP,
  REP_XP,
  RESCUE_MIN_SECONDS,
  RESCUE_XP,
  SESSION_MIN_SECONDS,
  STEP_XP,
  YARD_SESSION_XP,
} from '../data/rules';
import { awardXp, checkBadgeProgress } from '../services/gamificationEngine';
import { bossBonusApplies, questBonusApplies, rescueAvailable, weekStartOf, xpOn } from '../services/questEngine';
import type {
  CompletionBonus,
  CompletionInput,
  CompletionOutcome,
  GameEvent,
  GameState,
  RepAwards,
  RepInput,
  RepOutcome,
  SessionEnvironment,
  SessionMode,
  SessionRecord,
  StepCheckInput,
  StepOutcome,
} from '../types';
import { bankedRepXp, comboMultiplier } from './combo';
import { starsFor } from './mastery';
import { levelOf } from './progression';

// Anti-cheat and the session pipeline. Every check runs here, on the state, not only in the UI: a
// disabled button can be bypassed, a rule in the reducer cannot.

/** Whole seconds a live session has been running. */
export function elapsedSeconds(startedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

/** The live time a session needs before it can be confirmed: 3 minutes, or 60 seconds for the rescue drill. */
export const minSecondsFor = (mode: SessionMode): number => (mode === 'STREAK_RESCUE' ? RESCUE_MIN_SECONDS : SESSION_MIN_SECONDS);

/** Whether a session has run long enough to be confirmed. */
export function canConfirmSession(startedAt: number | null, now: number, mode: SessionMode = 'STANDARD'): boolean {
  return startedAt !== null && elapsedSeconds(startedAt, now) >= minSecondsFor(mode);
}

/** Base session XP by where it happened (the rescue drill is worth a fixed, small amount). */
const SESSION_XP: Record<SessionEnvironment, number | null> = { HOME_QUIET: null, YARD_LOW_DISTRACTION: YARD_SESSION_XP, OUTDOOR_STIMULI: OUTDOOR_SESSION_XP };

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

/** Confirms a command session: integrity checks, then XP (bonuses, multiplier, cap, level-up), stars, a loot box and badges. */
export function completeSession(state: GameState, input: CompletionInput): CompletionOutcome {
  const levelBefore = levelOf(state);
  // Stars before this session: the new session joins the log below, so counting later would miss the step up.
  const starsBefore = starsFor(state, input.commandId);
  const refused = (next: GameState, blocked: CompletionOutcome['blocked']): CompletionOutcome => ({
    state: next,
    xpAwarded: 0,
    capped: false,
    multiplier: 1,
    levelBefore,
    levelAfter: levelBefore,
    events: [],
    blocked,
    bonuses: [],
  });

  // The age lock and consent are enforced where sessions are recorded, not only in the UI: a stale modal
  // or a dog that became locked mid-session can't record a balanced session.
  if (input.track === 'BALANCED' && input.balancedAccess !== 'GRANTED') return refused(state, 'TRACK_NOT_ALLOWED');
  const wasFrozen = isFrozen(state, input.now);
  const action = registerAction(state, input.now);
  if (wasFrozen) return refused(action.state, 'FROZEN');
  if (action.tripped) return refused(action.state, 'RAPID_ACTIONS');
  const rescue = input.mode === 'STREAK_RESCUE';
  if (rescue && !rescueAvailable(state, input.commandId, input.today, input.hour)) return refused(action.state, 'RESCUE_NOT_AVAILABLE');
  if (!canConfirmSession(input.startedAt, input.now, input.mode)) return refused(action.state, 'SESSION_TOO_SHORT');

  // One award for the session, its banked steps and reps, so the multiplier and the cap treat them alike.
  const bonuses: CompletionBonus[] = [];
  let sessionXp = rescue ? RESCUE_XP : (SESSION_XP[input.environment] ?? input.xpReward);
  if (!rescue && questBonusApplies(input.commandId, input.hour, xpOn(state, input.today))) {
    sessionXp *= QUEST_BONUS_MULTIPLIER;
    bonuses.push('QUEST');
  }
  const boss = !rescue && bossBonusApplies(state, input.commandId, input.today);
  if (boss) {
    sessionXp *= BOSS_MULTIPLIER;
    bonuses.push('WEEKLY_BOSS');
  }
  const amount = Math.round(sessionXp) + bankedSteps(state, input.commandId, input.startedAt).length * STEP_XP + bankedRepXp(state, input.commandId, input.startedAt);
  const award = awardXp(action.state, { amount, reason: `session:${input.commandId}`, now: input.now, today: input.today });
  const session: SessionRecord = { commandId: input.commandId, track: input.track, environment: input.environment, day: input.today, at: input.now, xp: award.awarded };

  // The 60-second drill keeps the streak; stars and loot boxes are for full sessions.
  const events: GameEvent[] = [...award.events];
  let next: GameState = { ...award.state, stepAwards: null, repAwards: null, sessions: [...award.state.sessions, session].slice(-MAX_STORED_SESSIONS) };
  if (boss) next = { ...next, bossClearedWeek: weekStartOf(input.today) };
  if (!rescue) {
    const environments = next.mastery[input.commandId] ?? [];
    next = { ...next, mastery: { ...next.mastery, [input.commandId]: [...new Set([...environments, input.environment])] }, loot: { ...next.loot, pendingBoxes: next.loot.pendingBoxes + 1 } };
    const starsAfter = starsFor(next, input.commandId);
    if (starsAfter > starsBefore) events.push({ type: 'STAR_EARNED', commandId: input.commandId, stars: starsAfter });
    events.push({ type: 'LOOT_BOX_EARNED' });
  }
  const badges = checkBadgeProgress(next, { type: 'SESSION_COMPLETED', commandId: input.commandId, environment: input.environment }, input.now);

  return {
    state: badges.state,
    xpAwarded: award.awarded,
    capped: award.capped,
    multiplier: award.multiplier,
    levelBefore,
    levelAfter: levelOf(badges.state),
    events: [...events, ...badges.events],
    bonuses,
  };
}

/** The live session's rep record, or a fresh one. */
function repsOf(state: GameState, commandId: string, sessionStartedAt: number): RepAwards {
  const awards = state.repAwards;
  return awards && awards.commandId === commandId && awards.sessionStartedAt === sessionStartedAt ? awards : { sessionStartedAt, commandId, reps: 0, combo: 0, lastRepAt: 0, bankedXp: 0 };
}

/**
 * Logs a successful rep in the combo arena. Reps closer than four seconds are spam: they are not counted,
 * and more than three of them inside 15 seconds freezes scoring. A long pause ends the combo.
 */
export function logRep(state: GameState, input: RepInput): RepOutcome {
  const { commandId, sessionStartedAt, now } = input;
  if (sessionStartedAt === null) return { state, reps: 0, combo: 0, bankedXp: 0, refused: 'NO_LIVE_SESSION' };
  const current = repsOf(state, commandId, sessionStartedAt);
  const unchanged = (next: GameState, refused: RepOutcome['refused']): RepOutcome => ({ state: next, reps: current.reps, combo: current.combo, bankedXp: current.bankedXp, refused });
  if (isFrozen(state, now)) return unchanged(registerAction(state, now).state, 'FROZEN');
  if (current.lastRepAt > 0 && now - current.lastRepAt < REP_MIN_INTERVAL_MS) {
    const action = registerAction(state, now);
    return unchanged(action.state, action.tripped ? 'RAPID_ACTIONS' : 'TOO_SOON');
  }
  const combo = current.lastRepAt > 0 && now - current.lastRepAt > COMBO_RESET_MS ? 1 : current.combo + 1;
  const bankedXp = Math.min(REP_SESSION_MAX_XP, current.bankedXp + REP_XP * comboMultiplier(combo));
  const repAwards: RepAwards = { ...current, reps: current.reps + 1, combo, lastRepAt: now, bankedXp };
  return { state: { ...state, repAwards }, reps: repAwards.reps, combo, bankedXp };
}

/** "We're stuck": the combo starts again, the reps, banked XP and the session timer stay. */
export function logStruggle(state: GameState, commandId: string, sessionStartedAt: number | null): GameState {
  if (sessionStartedAt === null) return state;
  return { ...state, repAwards: { ...repsOf(state, commandId, sessionStartedAt), combo: 0 } };
}
