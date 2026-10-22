export type VolhardScore = 1 | 2 | 3 | 4 | 5 | 6;

export type VolhardTestId =
  | 'social-attraction'
  | 'following'
  | 'restraint'
  | 'social-proximity'
  | 'elevation'
  | 'retrieving'
  | 'touch-sensitivity'
  | 'sound-sensitivity'
  | 'sight-sensitivity'
  | 'stability';

export interface VolhardTest {
  id: VolhardTestId;
  order: number;
  nameHe: string;
  /** What the test observes, in ethological terms. */
  measuresHe: string;
  instructionsHe: string;
  /** Observed behaviour per score. Touch sensitivity has five levels in the original protocol, so 6 is absent there. */
  scoreDefinitionsHe: Partial<Record<VolhardScore, string>>;
  cautionHe?: string;
}

export type PreconditionId = 'age' | 'neutral-tester' | 'isolated-room' | 'physiological-balance';

export interface Precondition {
  id: PreconditionId;
  titleHe: string;
  detailHe: string;
}

export type TemperamentProfileId = 1 | 2 | 3 | 4 | 5 | 6;

export interface TemperamentProfile {
  id: TemperamentProfileId;
  titleHe: string;
  summaryHe: string;
  bestHomeHe: string;
  notForHe: string;
}

export type VolhardScores = Partial<Record<VolhardTestId, VolhardScore>>;

export interface VolhardResult {
  profile: TemperamentProfile;
  /** How many of the ten tests got each score. */
  distribution: Record<VolhardScore, number>;
  /** True when no score dominates (the mode covers fewer than four tests). */
  mixed: boolean;
  /** How a tie between equally frequent scores was decided, if there was one. */
  tieBreakHe?: string;
  /** Test-specific notes, e.g. a slow startle recovery on the sound test. */
  notesHe: string[];
}
