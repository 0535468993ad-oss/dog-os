import type { SessionTrack } from '@/features/gamification/types';

// The diagnostic assessment's contracts: the 11 answers, the signals the engine derives from them, and
// the calibrated balanced-track gate with its targeted, versioned warnings.

export type AgeStage = 'PUPPY_2_6M' | 'ADOLESCENT_6_18M' | 'ADULT_1_7Y' | 'SENIOR_7Y_PLUS';
export type LivingEnv = 'BUSY_CITY_APT' | 'QUIET_APT' | 'HOUSE_WITH_YARD' | 'RURAL_OPEN';
export type HandlerExperience = 'FIRST_TIME' | 'INTERMEDIATE' | 'EXPERIENCED_WORKING_DOGS';
/** A 1–5 rating (5 = the most). */
export type DriveLevel = 1 | 2 | 3 | 4 | 5;
export type StartleRecovery = 'FEARFUL_SLOW_RECOVERY' | 'STARTLES_RECOVERS_FAST' | 'CONFIDENT_INVESTIGATES';
export type CorrectionSensitivity = 'SHUTS_DOWN_APPEASES' | 'LISTENS_AND_ADJUSTS' | 'IGNORES_PUSHES_THROUGH';
export type OutdoorFocus = 'HIGH_CHECK_IN' | 'DISTRACTED_BY_SCENTS' | 'DISCONNECTED_TUNNEL_VISION';
export type ReactivityType = 'CALM_SOCIAL' | 'FRUSTRATED_EXCITED_PULLER' | 'REACTIVE_LUNGING_BARKING' | 'SHY_AVOIDANT';
export type TrainingGoal =
  | 'STOP_LEASH_PULLING'
  | 'RELIABLE_OFF_LEASH_RECALL'
  | 'IMPULSE_CONTROL_LEAVE_IT'
  | 'CALM_PLACE_AT_CAFE'
  | 'CONFIDENCE_BUILDING'
  | 'WORKING_OBEDIENCE';

export interface AssessmentAnswers {
  ageStage: AgeStage;
  livingEnv: LivingEnv;
  handlerExperience: HandlerExperience;
  foodDrive: DriveLevel;
  playPreyDrive: DriveLevel;
  energyLevel: DriveLevel;
  startleRecovery: StartleRecovery;
  correctionSensitivity: CorrectionSensitivity;
  outdoorFocus: OutdoorFocus;
  reactivityType: ReactivityType;
  /** At least one. */
  primaryGoals: readonly TrainingGoal[];
}

export type AssessmentKey = keyof AssessmentAnswers;

export type PrimaryMotivator = 'HIGH_VALUE_FOOD' | 'TUG_AND_PREY_TOY' | 'HYBRID_REWARD';
export type NerveProfile = 'SENSITIVE_SOFT' | 'BALANCED_STABLE' | 'HARD_HIGH_DRIVE';
export type ArousalLevel = 'LOW' | 'MODERATE' | 'HIGH';

/** What the engine reads about a dog, from a full assessment or from the legacy one-tap trait. */
export interface DogSignals {
  /** Months, from the birth date, else the age stage's lower bound; null when unknown. */
  ageMonths: number | null;
  nerve: NerveProfile;
  arousal: ArousalLevel;
  /** null for the legacy trait, which doesn't ask about rewards. */
  motivator: PrimaryMotivator | null;
  fearful: boolean;
  reactiveLunging: boolean;
  handler: HandlerExperience | null;
  correction: CorrectionSensitivity | null;
  reliabilityGoal: boolean;
  answers: AssessmentAnswers | null;
}

/** Ordered from the most restrictive: only LOCKED cannot be opened by the owner. */
export type BalancedGate = 'LOCKED' | 'ADVISED_AGAINST' | 'PROFESSIONAL_ADVISED' | 'OPEN';

export type RiskId = 'PUPPY_FLOOR' | 'SENSITIVE_NERVE' | 'FEAR_REACTIVE' | 'ADOLESCENT' | 'NOVICE_TIMING' | 'HIGH_AROUSAL' | 'UNKNOWN_AGE';
/** INFO needs no acknowledgment; BLOCKING is the floor and cannot be acknowledged away. */
export type RiskSeverity = 'INFO' | 'CAUTION' | 'HIGH' | 'BLOCKING';

export interface RiskWarning {
  id: RiskId;
  /** Bumped when the warning's meaning changes, so owners confirm the new wording. */
  version: number;
  severity: RiskSeverity;
  textHe: string;
}

/** The assessment as stored with the dog's synced training state. */
export interface StoredAssessment {
  answers: AssessmentAnswers;
  /** ISO timestamp. */
  completedAt: string;
  selectedTrack: SessionTrack;
  /** The owner chose a different track from the recommendation. */
  ownerOverrodeTrack: boolean;
}
