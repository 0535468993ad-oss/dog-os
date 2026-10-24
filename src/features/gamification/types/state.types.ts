import type { BadgeId } from './gamification.types';

// The engine's internal, synced state and the inputs and outputs of scoring.

export type SessionTrack = 'FORCE_FREE' | 'BALANCED';

/** Where a session took place: generalisation means moving from the quiet home to real-world distractions. */
export type SessionEnvironment = 'HOME_QUIET' | 'OUTDOOR_STIMULI';

export interface SessionRecord {
  commandId: string;
  track: SessionTrack;
  environment: SessionEnvironment;
  /** Calendar day (YYYY-MM-DD) of the session. */
  day: string;
  /** Completion time, epoch ms. */
  at: number;
  xp: number;
}

/** Training choices that travel with the dog's progress (validated by the training feature). */
export interface TrainingPreferences {
  temperament: string | null;
  trackByCommand: Record<string, SessionTrack>;
  /** The owner confirmed the balanced-track safety notice. */
  balancedAcknowledged: boolean;
}

/** Everything the engine keeps per dog: synced to Supabase, cached on the device. */
export interface GameState {
  version: 1;
  totalXp: number;
  xpByDay: Record<string, number>;
  sessions: SessionRecord[];
  /** Recent action times (epoch ms) for the rapid-action defence. */
  actionLog: number[];
  /** Scoring is frozen until this time (epoch ms); 0 when not frozen. */
  frozenUntil: number;
  badges: BadgeId[];
  /** ISO time each badge was unlocked. */
  badgeUnlockedAt: Partial<Record<BadgeId, string>>;
  claimedRewards: string[];
  /** When the owner last reviewed the toxic-foods list (epoch ms); 0 = never. */
  toxinReviewedAt: number;
  /**
   * Steps ticked in the current live session (identified by its start time), banked until the session
   * is confirmed. A new session replaces it, so a step pays once per session however often it is ticked.
   */
  stepAwards: { sessionStartedAt: number; commandId: string; steps: number[] } | null;
  preferences: TrainingPreferences;
  /**
   * Every calendar day with a session, kept apart from the session log: old sessions roll off the log,
   * but the days they were trained still count towards ranks and streaks.
   */
  activeDays: string[];
  /** When this state last changed on a device (epoch ms) – the last-write-wins sync clock. */
  updatedAt: number;
}

export type GameEvent =
  | { type: 'XP_AWARDED'; amount: number; multiplier: number; reason: string }
  | { type: 'LEVEL_UP'; from: number; to: number }
  | { type: 'BADGE_UNLOCKED'; badgeId: BadgeId };

/** What can move a badge forward. */
export type BadgeAction =
  | { type: 'SESSION_COMPLETED'; commandId: string; environment: SessionEnvironment }
  | { type: 'TOXIN_REVIEWED' };

export type CompletionBlock = 'SESSION_TOO_SHORT' | 'RAPID_ACTIONS' | 'FROZEN';

/** A training step checked during a live session. */
export interface StepCheckInput {
  commandId: string;
  stepIndex: number;
  /** How many steps the command's protocol has; indexes outside it earn nothing. */
  stepCount: number;
  /** Start of the running live session (epoch ms), or null when none is running. */
  sessionStartedAt: number | null;
  now: number;
}

export type StepRefusal = 'NO_LIVE_SESSION' | 'INVALID_STEP' | 'ALREADY_AWARDED' | 'RAPID_ACTIONS' | 'FROZEN';

export interface StepOutcome {
  state: GameState;
  /** XP this session's ticked steps will pay when it is confirmed (before multiplier and cap). */
  bankedXp: number;
  refused?: StepRefusal;
}

export interface CompletionInput {
  commandId: string;
  /** The command's XP at home, COMMAND_XP (outdoors earns OUTDOOR_SESSION_XP instead). */
  xpReward: number;
  track: SessionTrack;
  environment: SessionEnvironment;
  /** When the live session timer started, epoch ms. */
  startedAt: number;
  now: number;
  today: string;
}

export interface CompletionOutcome {
  state: GameState;
  xpAwarded: number;
  /** The daily cap cut the award. */
  capped: boolean;
  multiplier: number;
  levelBefore: number;
  levelAfter: number;
  events: GameEvent[];
  blocked?: CompletionBlock;
}

/** The per-dog summary stored in Supabase next to the full state. */
export interface GameSummary {
  xp: number;
  level: number;
  streakDays: number;
  distinctActiveDays: number;
  dailyXpEarned: number;
  dailyXpDate: string | null;
  unlockedTrophies: BadgeId[];
  claimedRewards: string[];
  lastSessionAt: string | null;
}
