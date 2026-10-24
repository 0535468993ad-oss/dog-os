import { BADGES, LEGACY_BADGE_IDS } from '../data/badgesData';
import { findReward } from '../data/rewardsData';
import type { BadgeId, GameState, SessionEnvironment, SessionRecord, SessionTrack, TrainingPreferences } from '../types';

// The stored state comes from device storage and from Supabase, so it is parsed field by field: a
// corrupt or tampered value falls back to a safe default instead of crashing the screen. States saved
// in the earlier training-only format (flat preferences, trophies) are read too.

export const EMPTY_PREFERENCES: TrainingPreferences = { temperament: null, trackByCommand: {}, balancedAcknowledged: false };

export const EMPTY_GAME_STATE: GameState = {
  version: 1,
  totalXp: 0,
  xpByDay: {},
  sessions: [],
  actionLog: [],
  frozenUntil: 0,
  badges: [],
  badgeUnlockedAt: {},
  claimedRewards: [],
  toxinReviewedAt: 0,
  stepAwards: null,
  preferences: EMPTY_PREFERENCES,
  activeDays: [],
  updatedAt: 0,
};

const BADGE_IDS: ReadonlySet<string> = new Set(BADGES.map((badge) => badge.id));
const TRACKS: ReadonlySet<string> = new Set<SessionTrack>(['FORCE_FREE', 'BALANCED']);
const ENVIRONMENTS: ReadonlySet<string> = new Set<SessionEnvironment>(['HOME_QUIET', 'OUTDOOR_STIMULI']);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9-]{1,40}$/;
const TRAIT = /^[A-Z_]{1,40}$/;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isTrack = (value: unknown): value is SessionTrack => typeof value === 'string' && TRACKS.has(value);
const isBadgeId = (value: unknown): value is BadgeId => typeof value === 'string' && BADGE_IDS.has(value);
/** A badge id, upgrading the pre-rename streak ids. */
const badgeId = (value: unknown): BadgeId | null => (typeof value !== 'string' ? null : isBadgeId(value) ? value : (LEGACY_BADGE_IDS[value] ?? null));
const strings = (value: unknown, valid: (item: string) => boolean): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && valid(item)) : []);

/** A stored session, or null when any field is invalid. */
function parseSession(value: unknown): SessionRecord | null {
  if (!isRecord(value)) return null;
  const { commandId, track, environment, day, at, xp } = value;
  if (typeof commandId !== 'string' || !ID.test(commandId) || !isTrack(track) || typeof environment !== 'string' || !ENVIRONMENTS.has(environment)) return null;
  if (typeof day !== 'string' || !ISO_DAY.test(day) || !isCount(at) || !isCount(xp)) return null;
  return { commandId, track, environment: environment as SessionEnvironment, day, at, xp };
}

/** The current session's step awards, or null when missing or invalid. */
function parseStepAwards(value: unknown): GameState['stepAwards'] {
  if (!isRecord(value) || !isCount(value.sessionStartedAt) || typeof value.commandId !== 'string' || !ID.test(value.commandId)) return null;
  const steps = Array.isArray(value.steps) ? value.steps.filter((step): step is number => Number.isInteger(step) && step >= 0) : [];
  return { sessionStartedAt: value.sessionStartedAt, commandId: value.commandId, steps };
}

/** Training preferences, from the nested object or the earlier flat fields. */
function parsePreferences(raw: Record<string, unknown>): TrainingPreferences {
  const source = isRecord(raw.preferences) ? raw.preferences : raw;
  const trackByCommand: Record<string, SessionTrack> = {};
  if (isRecord(source.trackByCommand)) {
    for (const [key, track] of Object.entries(source.trackByCommand)) if (ID.test(key) && isTrack(track)) trackByCommand[key] = track;
  }
  return {
    temperament: typeof source.temperament === 'string' && TRAIT.test(source.temperament) ? source.temperament : null,
    trackByCommand,
    balancedAcknowledged: source.balancedAcknowledged === true,
  };
}

/** Parses stored JSON into a valid game state (EMPTY_GAME_STATE when unusable). */
export function parseGameState(raw: unknown): GameState {
  if (!isRecord(raw) || raw.version !== 1) return EMPTY_GAME_STATE;
  const xpByDay: Record<string, number> = {};
  if (isRecord(raw.xpByDay)) {
    for (const [day, xp] of Object.entries(raw.xpByDay)) if (ISO_DAY.test(day) && isCount(xp)) xpByDay[day] = xp;
  }
  const sessions = Array.isArray(raw.sessions) ? raw.sessions.flatMap((session) => parseSession(session) ?? []) : [];
  const badgeUnlockedAt: GameState['badgeUnlockedAt'] = {};
  if (isRecord(raw.badgeUnlockedAt)) {
    for (const [id, at] of Object.entries(raw.badgeUnlockedAt)) {
      const known = badgeId(id);
      if (known && typeof at === 'string') badgeUnlockedAt[known] = at;
    }
  }
  return {
    version: 1,
    totalXp: isCount(raw.totalXp) ? raw.totalXp : 0,
    xpByDay,
    sessions,
    actionLog: Array.isArray(raw.actionLog) ? raw.actionLog.filter(isCount) : [],
    frozenUntil: isCount(raw.frozenUntil) ? raw.frozenUntil : 0,
    badges: Array.isArray(raw.badges) ? [...new Set(raw.badges.flatMap((id) => badgeId(id) ?? []))] : [],
    badgeUnlockedAt,
    claimedRewards: strings(raw.claimedRewards, (id) => findReward(id) !== undefined),
    toxinReviewedAt: isCount(raw.toxinReviewedAt) ? raw.toxinReviewedAt : 0,
    stepAwards: parseStepAwards(raw.stepAwards),
    preferences: parsePreferences(raw),
    // States saved before activeDays existed rebuild it from their sessions.
    activeDays: [...new Set([...strings(raw.activeDays, (day) => ISO_DAY.test(day)), ...sessions.map((session) => session.day)])].sort(),
    updatedAt: isCount(raw.updatedAt) ? raw.updatedAt : 0,
  };
}
