import { MASTER_COMMANDS } from '../data/masterCommands';
import type { GameState, MasterCommandId, SessionEnvironment, SessionRecord, TemperamentTrait, TrainingTrack, TrophyId } from '../types';

// The stored game state comes from device storage, so it is parsed field by field: a corrupt or
// tampered value falls back to a safe default instead of crashing the screen.

export const EMPTY_GAME_STATE: GameState = {
  version: 1,
  totalXp: 0,
  xpByDay: {},
  sessions: [],
  actionLog: [],
  frozenUntil: 0,
  trophies: [],
  temperament: null,
  trackByCommand: {},
  balancedAcknowledged: false,
  activeDays: [],
  updatedAt: 0,
};

const COMMAND_IDS: ReadonlySet<string> = new Set(MASTER_COMMANDS.map((command) => command.id));
const TRACKS: ReadonlySet<string> = new Set<TrainingTrack>(['FORCE_FREE', 'BALANCED']);
const ENVIRONMENTS: ReadonlySet<string> = new Set<SessionEnvironment>(['HOME_QUIET', 'OUTDOOR_STIMULI']);
const TRAITS: ReadonlySet<string> = new Set<TemperamentTrait>(['ANXIOUS_SENSITIVE', 'STEADY', 'HIGH_AROUSAL_PREY']);
const TROPHY_IDS: ReadonlySet<string> = new Set<TrophyId>(['iron-shield', 'recall-magnet', 'steel-control', 'field-beast']);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isCommandId = (value: unknown): value is MasterCommandId => typeof value === 'string' && COMMAND_IDS.has(value);
const isTrack = (value: unknown): value is TrainingTrack => typeof value === 'string' && TRACKS.has(value);

/** A stored session, or null when any field is invalid. */
function parseSession(value: unknown): SessionRecord | null {
  if (!isRecord(value)) return null;
  const { commandId, track, environment, day, at, xp } = value;
  if (!isCommandId(commandId) || !isTrack(track) || typeof environment !== 'string' || !ENVIRONMENTS.has(environment)) return null;
  if (typeof day !== 'string' || !ISO_DAY.test(day) || !isCount(at) || !isCount(xp)) return null;
  return { commandId, track, environment: environment as SessionEnvironment, day, at, xp };
}

/** The chosen track per command, keeping only valid entries. */
function parseTracks(value: unknown): GameState['trackByCommand'] {
  if (!isRecord(value)) return {};
  const tracks: GameState['trackByCommand'] = {};
  for (const [key, track] of Object.entries(value)) {
    if (isCommandId(key) && isTrack(track)) tracks[key] = track;
  }
  return tracks;
}

/** Parses stored JSON into a valid game state (EMPTY_GAME_STATE when unusable). */
export function parseGameState(raw: unknown): GameState {
  if (!isRecord(raw) || raw.version !== 1) return EMPTY_GAME_STATE;
  const xpByDay: Record<string, number> = {};
  if (isRecord(raw.xpByDay)) {
    for (const [day, xp] of Object.entries(raw.xpByDay)) if (ISO_DAY.test(day) && isCount(xp)) xpByDay[day] = xp;
  }
  const sessions = Array.isArray(raw.sessions) ? raw.sessions.flatMap((session) => parseSession(session) ?? []) : [];
  const storedDays = Array.isArray(raw.activeDays) ? raw.activeDays.filter((day): day is string => typeof day === 'string' && ISO_DAY.test(day)) : [];
  return {
    version: 1,
    totalXp: isCount(raw.totalXp) ? raw.totalXp : 0,
    xpByDay,
    sessions,
    actionLog: Array.isArray(raw.actionLog) ? raw.actionLog.filter(isCount) : [],
    frozenUntil: isCount(raw.frozenUntil) ? raw.frozenUntil : 0,
    trophies: Array.isArray(raw.trophies) ? raw.trophies.filter((id): id is TrophyId => typeof id === 'string' && TROPHY_IDS.has(id)) : [],
    temperament: typeof raw.temperament === 'string' && TRAITS.has(raw.temperament) ? (raw.temperament as TemperamentTrait) : null,
    trackByCommand: parseTracks(raw.trackByCommand),
    balancedAcknowledged: raw.balancedAcknowledged === true,
    // States saved before activeDays existed rebuild it from their sessions.
    activeDays: [...new Set([...storedDays, ...sessions.map((session) => session.day)])].sort(),
    updatedAt: isCount(raw.updatedAt) ? raw.updatedAt : 0,
  };
}
