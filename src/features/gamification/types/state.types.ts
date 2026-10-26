import type { StoredAssessment } from '@/features/training/types';

import type { BadgeId } from './gamification.types';

// The engine's internal, synced state and the inputs and outputs of scoring.

export type SessionTrack = 'FORCE_FREE' | 'BALANCED';

/**
 * Whether balanced-track content may render and be recorded for a dog right now: LOCKED is the age
 * floor; NEEDS_RULES / NEEDS_RISKS wait for the owner's current-version acknowledgments.
 */
export type BalancedAccess = 'GRANTED' | 'LOCKED' | 'NEEDS_RULES' | 'NEEDS_RISKS';

/**
 * Where a session took place – the three mastery stars: the quiet home, a yard or quiet park, then the
 * street with real distractions. OUTDOOR_STIMULI keeps its stored name (it is the street tier).
 */
export type SessionEnvironment = 'HOME_QUIET' | 'YARD_LOW_DISTRACTION' | 'OUTDOOR_STIMULI';

/** STREAK_RESCUE: the late-evening 60-second touch drill that keeps a streak alive on an empty day. */
export type SessionMode = 'STANDARD' | 'STREAK_RESCUE';

/** Reps logged in the current live session, banked like steps until the session is confirmed. */
export interface RepAwards {
  sessionStartedAt: number;
  commandId: string;
  reps: number;
  /** Successful reps in a row since the last struggle or pause. */
  combo: number;
  lastRepAt: number;
  bankedXp: number;
}

/** Loot boxes earned by verified sessions and what they have paid out. */
export interface LootInventory {
  pendingBoxes: number;
  /** Boxes opened since the last rare-or-better drop (the pity timer). */
  boxesSinceLastRare: number;
  goldenBones: number;
  cards: string[];
  frames: string[];
  titles: string[];
}

/** The weekly league: the tier, and the week (its Sunday, YYYY-MM-DD) the tier applies to. */
export interface LeagueState {
  tier: number;
  weekId: string | null;
}

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
  /** The version of the balanced-track safety rules the owner confirmed (null = never). */
  balancedRulesAckVersion: number | null;
  /** Targeted warnings the owner confirmed: warning id → version confirmed. */
  acknowledgedRisks: Record<string, number>;
  /** The diagnostic assessment for this dog, when it was done. */
  assessment: StoredAssessment | null;
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
  repAwards: RepAwards | null;
  loot: LootInventory;
  /** Streak freeze shields in reserve; one covers one missed day. */
  streakShields: number;
  /** Missed days a shield covered: they keep the streak, but are not training days for ranks. */
  shieldedDays: string[];
  /** Environments each command has been confirmed in (the three-star mastery). */
  mastery: Record<string, SessionEnvironment[]>;
  league: LeagueState;
  /** The week (its Sunday) whose boss challenge has been cleared, so the 2× pays once a week. */
  bossClearedWeek: string | null;
}

export type GameEvent =
  | { type: 'XP_AWARDED'; amount: number; multiplier: number; reason: string }
  | { type: 'LEVEL_UP'; from: number; to: number }
  | { type: 'BADGE_UNLOCKED'; badgeId: BadgeId }
  | { type: 'LOOT_BOX_EARNED' }
  | { type: 'STAR_EARNED'; commandId: string; stars: number }
  | { type: 'SHIELD_USED'; days: string[] }
  | { type: 'LEAGUE_SETTLED'; from: number; to: number };

/** What can move a badge forward. */
export type BadgeAction =
  | { type: 'SESSION_COMPLETED'; commandId: string; environment: SessionEnvironment }
  | { type: 'TOXIN_REVIEWED' };

export type CompletionBlock = 'SESSION_TOO_SHORT' | 'RAPID_ACTIONS' | 'FROZEN' | 'RESCUE_NOT_AVAILABLE' | 'TRACK_NOT_ALLOWED';

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
  /** The dog's balanced access at confirmation: a BALANCED session is recorded only when GRANTED. */
  balancedAccess: BalancedAccess;
  environment: SessionEnvironment;
  /** When the live session timer started, epoch ms. */
  startedAt: number;
  now: number;
  today: string;
  /** Local hour (0–23) of `now`, for the time-of-day quests and the rescue window. */
  hour: number;
  mode: SessionMode;
}

export type RepRefusal = 'NO_LIVE_SESSION' | 'TOO_SOON' | 'RAPID_ACTIONS' | 'FROZEN';

/** A successful rep logged in the combo arena. */
export interface RepInput {
  commandId: string;
  sessionStartedAt: number | null;
  now: number;
}

export interface RepOutcome {
  state: GameState;
  reps: number;
  combo: number;
  bankedXp: number;
  refused?: RepRefusal;
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
  /** XP multipliers that applied besides the streak (quest, weekly boss). */
  bonuses: CompletionBonus[];
}

export type CompletionBonus = 'QUEST' | 'WEEKLY_BOSS';

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
