import type { NerveProfile } from './assessment';
import type { GearItem, MasterCommandId } from './commands';

// The training curriculum contract: the nine master commands, taught reward-first, with handler mechanics,
// a shared marker vocabulary and profile-tagged troubleshooting. Field names predate the "master database"
// spec and are kept: difficulty = difficultyLevel, stepIndex = stepNumber, titleHe = title, instructionHe = instruction.

export type TrainingCategory = 'FOUNDATION_OBEDIENCE' | 'IMPULSE_CONTROL' | 'LIFE_SAVING_SAFETY' | 'ENGAGEMENT_TARGETING';

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

/** The three usual reasons a rep fails: the setting is too hard, the marker came late, the pace is too fast. */
export type StruggleCause = 'TOO_DISTRACTING' | 'LATE_MARKER' | 'TOO_FAST';

/** Which marker a step uses: whether the dog may leave position to collect the reward. */
export type MarkerKind = 'TERMINAL' | 'CONTINUATION';

/** The words that tell the dog what a reward means and when the exercise ends. */
export interface CommandMarkers {
  /** The behaviour is done: the reward follows and the dog may leave position to collect it. */
  terminal: string;
  /** Right, keep going: the dog holds position and the reward is brought to it. */
  continuation: string;
  /** The exercise is over: the dog is free to move. */
  releaseWord: string;
}

export interface TrainingStep {
  stepIndex: number;
  titleHe: string;
  instructionHe: string;
  /** Leash, hands, body position and timing for this step. Reward-based only: no leash pressure. */
  handlerMechanics: string;
  /** TERMINAL ("כן!") lets the dog leave position for the reward; CONTINUATION ("טוב") keeps it in position. */
  marker: MarkerKind;
  /** The exact moment to mark – the behaviour the reward is for. */
  markerCue: string;
  /** Suggested length of this step's mini-session, in seconds. */
  durationSec?: number;
}

export interface TroubleshootingEntry {
  commonMistake: string;
  /** The reward-based or spatial-management fix – valid on both tracks. */
  correctionOrAdjustment: string;
  /**
   * A structural escalation (leash pressure and release, body blocking) for a behaviour the dog already knows.
   * Shown only on the balanced track with access granted and never for a sensitive dog; never exported to the AI corpus.
   */
  balancedEscalation?: string;
  /** Nerve profiles for which this tip is listed first. Empty: a general tip. */
  highlightFor: readonly NerveProfile[];
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
  markers: CommandMarkers;
  steps: TrainingStep[];
  /** At least three; the dog's own profile decides which come first. */
  balancedTroubleshooting: readonly TroubleshootingEntry[];
  /** Always ends with GENERALIZATION_RULE_HE, word for word. */
  environmentalGeneralization: string;
  /** Profiles for which this command is a priority. Every profile can learn every command. */
  suitableForProfiles: readonly NerveProfile[];
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
