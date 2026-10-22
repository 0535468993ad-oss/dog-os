import type { MasterCommandId, TemperamentTrait, TrainingTrack } from './commands';

/** Where a session took place: generalisation means moving from the quiet home to real-world distractions. */
export type SessionEnvironment = 'HOME_QUIET' | 'OUTDOOR_STIMULI';

export type TrophyId = 'iron-shield' | 'recall-magnet' | 'steel-control' | 'field-beast';

export interface SessionRecord {
  commandId: MasterCommandId;
  track: TrainingTrack;
  environment: SessionEnvironment;
  /** Calendar day (YYYY-MM-DD) of the session. */
  day: string;
  /** Completion time, epoch ms. */
  at: number;
  xp: number;
}

/** Everything the gamification layer keeps per dog, on the device. */
export interface GameState {
  version: 1;
  totalXp: number;
  xpByDay: Record<string, number>;
  sessions: SessionRecord[];
  /** Recent action times (epoch ms) for the rapid-click defence. */
  actionLog: number[];
  /** Scoring is frozen until this time (epoch ms); 0 when not frozen. */
  frozenUntil: number;
  trophies: TrophyId[];
  temperament: TemperamentTrait | null;
  trackByCommand: Partial<Record<MasterCommandId, TrainingTrack>>;
  /** The owner confirmed the balanced-track safety notice. */
  balancedAcknowledged: boolean;
  /**
   * Every calendar day with a session, kept apart from the session log: old sessions roll off the log,
   * but the days they were trained still count towards levels.
   */
  activeDays: string[];
  /** When this state last changed on a device (epoch ms) – the last-write-wins sync clock. */
  updatedAt: number;
}

/** The per-dog summary stored in Supabase next to the full state. */
export interface GameSummary {
  xp: number;
  level: number;
  streakDays: number;
  distinctActiveDays: number;
  dailyXpEarned: number;
  dailyXpDate: string | null;
  unlockedTrophies: TrophyId[];
  lastSessionAt: string | null;
}

export interface Level {
  level: number;
  titleHe: string;
  minXp: number;
  /** Distinct training days required (from level 4): XP alone cannot buy a level. */
  minActiveDays: number;
}

export interface Trophy {
  id: TrophyId;
  nameHe: string;
  descriptionHe: string;
}

export type CompletionBlock = 'SESSION_TOO_SHORT' | 'RAPID_ACTIONS' | 'FROZEN';

export interface CompletionInput {
  commandId: MasterCommandId;
  track: TrainingTrack;
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
  newTrophies: TrophyId[];
  blocked?: CompletionBlock;
}
