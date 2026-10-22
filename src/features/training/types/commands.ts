export type MasterCommandId = 'sit' | 'down' | 'stay' | 'recall' | 'place' | 'leave-it' | 'drop-it' | 'heel' | 'touch';

/**
 * FORCE_FREE: reward-based only (R+, negative punishment by withholding rewards).
 * BALANCED: reward-based foundation plus fair, low-level pressure and release (R-) and corrections (P+).
 */
export type TrainingTrack = 'FORCE_FREE' | 'BALANCED';

export interface GearItem {
  nameHe: string;
  noteHe?: string;
}

export interface TrackProtocol {
  summaryHe: string;
  /** Ordered steps. The generalisation rule is appended by the protocol util, never stored here. */
  stepsHe: readonly string[];
  /** Track-specific gear on top of the command's shared gear. */
  gear: readonly GearItem[];
  cautionsHe: readonly string[];
}

export interface MasterCommand {
  id: MasterCommandId;
  order: number;
  nameHe: string;
  nameEn: string;
  /** The spoken cue, as the owner says it. */
  cueHe: string;
  goalHe: string;
  /** Tactical gear for this command, whatever the track. */
  gear: readonly GearItem[];
  forceFree: TrackProtocol;
  balanced: TrackProtocol;
}

/** Temperament as the owner observes it day to day. Arousal and prey drive, not "dominance". */
export type TemperamentTrait = 'ANXIOUS_SENSITIVE' | 'STEADY' | 'HIGH_AROUSAL_PREY';

export interface TemperamentInput {
  trait: TemperamentTrait;
  /** null when the birth date is unknown. */
  ageMonths: number | null;
  breedId: string | null;
}

export interface TrainingRecommendation {
  track: TrainingTrack;
  titleHe: string;
  reasonsHe: string[];
  principlesHe: string[];
  /** Whether the balanced track may be offered at all for this dog. */
  balancedAllowed: boolean;
  /** Tools are introduced only with a qualified trainer. */
  requiresProfessional: boolean;
}
