import type { SessionTrack } from '@/features/gamification/types';

export type MasterCommandId = 'sit' | 'down' | 'stay' | 'recall' | 'place' | 'leave-it' | 'drop-it' | 'heel' | 'touch';

/**
 * FORCE_FREE: reward-based only (R+, negative punishment by withholding rewards) – the curriculum in
 * commandsData. BALANCED: the same foundation plus fair, low-level pressure and release (R-) and
 * corrections (P+), behind a safety notice – balancedProtocols. Sessions record which one was used.
 */
export type TrainingTrack = SessionTrack;

export interface GearItem {
  nameHe: string;
  noteHe?: string;
}

/** The optional balanced protocol for a command. */
export interface TrackProtocol {
  summaryHe: string;
  /** Ordered steps. The command's generalisation step is appended by the protocol util. */
  stepsHe: readonly string[];
  /** Balanced-only gear on top of the command's own gear. */
  gear: readonly GearItem[];
  cautionsHe: readonly string[];
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
