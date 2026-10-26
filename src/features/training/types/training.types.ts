import type { GearItem, MasterCommandId } from './commands';

// The training curriculum contract: the nine master commands as taught with reward-based training.

export type TrainingCategory = 'FOUNDATION_OBEDIENCE' | 'IMPULSE_CONTROL' | 'LIFE_SAVING_SAFETY' | 'ENGAGEMENT_TARGETING';

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

/** The three usual reasons a rep fails: the setting is too hard, the marker came late, the pace is too fast. */
export type StruggleCause = 'TOO_DISTRACTING' | 'LATE_MARKER' | 'TOO_FAST';

export interface TrainingStep {
  stepIndex: number;
  titleHe: string;
  instructionHe: string;
  /** The exact moment to mark ("כן!" or click) – the behaviour the reward is for. */
  markerCue: string;
  /** Suggested length of this step's mini-session, in seconds. */
  durationSec?: number;
}

export interface TrainingCommand {
  id: MasterCommandId;
  nameHe: string;
  nameEn: string;
  category: TrainingCategory;
  difficulty: DifficultyLevel;
  targetGoal: string;
  /** Command ids to teach first. */
  prerequisites: MasterCommandId[];
  steps: TrainingStep[];
  commonMistakes: string[];
  /** Always ends with GENERALIZATION_RULE_HE, word for word. */
  environmentalGeneralization: string;
  /** For an anxious dog: calm spatial structure and lower pressure instead of correction. */
  anxiousDogAdjustmentHe: string;
  /** Base XP for a confirmed live session (before multipliers and the outdoor bonus). */
  xpReward: number;
  /** Teaching order, 1–9. */
  order: number;
  /** The spoken cue, as the owner says it. */
  cueHe: string;
  /** Tactical gear for this command, whatever the track. */
  gear: readonly GearItem[];
  /** A one-sentence fix for each struggle cause, shown by the "we're stuck" sheet. */
  struggleDiagnostics: Readonly<Record<StruggleCause, string>>;
}

/** A command as written in the data files; the struggle fixes are joined in by commandsData. */
export type TrainingCommandBase = Omit<TrainingCommand, 'struggleDiagnostics'>;
