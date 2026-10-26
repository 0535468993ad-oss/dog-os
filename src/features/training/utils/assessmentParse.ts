import {
  AGE_STAGE_LABELS_HE,
  CORRECTION_LABELS_HE,
  GOAL_LABELS_HE,
  HANDLER_LABELS_HE,
  LIVING_ENV_LABELS_HE,
  OUTDOOR_FOCUS_LABELS_HE,
  REACTIVITY_LABELS_HE,
  STARTLE_LABELS_HE,
} from '../data/assessmentQuestions';
import type { AssessmentAnswers, DriveLevel, StoredAssessment, TrainingGoal, TrainingTrack } from '../types';

// Stored assessments come from device storage and Supabase, so they are validated field by field. Enum
// values are own-property checks against the label tables – never `in`, so "toString" or "__proto__"
// can't pass as an answer.

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Whether `value` is one of the table's own keys. */
export function isOption<T extends string>(table: Readonly<Record<T, string>>, value: unknown): value is T {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(table, value);
}

/** A 1–5 drive rating. */
export const isDriveLevel = (value: unknown): value is DriveLevel => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;

const isTrack = (value: unknown): value is TrainingTrack => value === 'FORCE_FREE' || value === 'BALANCED';

/** The goals, de-duplicated; null unless every entry is a valid goal and there is at least one. */
function parseGoals(value: unknown): TrainingGoal[] | null {
  if (!Array.isArray(value)) return null;
  const valid = value.filter((goal): goal is TrainingGoal => isOption(GOAL_LABELS_HE, goal));
  return valid.length > 0 && valid.length === value.length ? [...new Set(valid)] : null;
}

/** A complete, valid answer set, or null when any answer is missing or invalid. */
export function parseAnswers(value: unknown): AssessmentAnswers | null {
  if (!isRecord(value)) return null;
  const primaryGoals = parseGoals(value.primaryGoals);
  const { ageStage, livingEnv, handlerExperience, foodDrive, playPreyDrive, energyLevel, startleRecovery, correctionSensitivity, outdoorFocus, reactivityType } = value;
  if (
    !primaryGoals ||
    !isOption(AGE_STAGE_LABELS_HE, ageStage) ||
    !isOption(LIVING_ENV_LABELS_HE, livingEnv) ||
    !isOption(HANDLER_LABELS_HE, handlerExperience) ||
    !isDriveLevel(foodDrive) ||
    !isDriveLevel(playPreyDrive) ||
    !isDriveLevel(energyLevel) ||
    !isOption(STARTLE_LABELS_HE, startleRecovery) ||
    !isOption(CORRECTION_LABELS_HE, correctionSensitivity) ||
    !isOption(OUTDOOR_FOCUS_LABELS_HE, outdoorFocus) ||
    !isOption(REACTIVITY_LABELS_HE, reactivityType)
  ) {
    return null;
  }
  return { ageStage, livingEnv, handlerExperience, foodDrive, playPreyDrive, energyLevel, startleRecovery, correctionSensitivity, outdoorFocus, reactivityType, primaryGoals };
}

/** A stored assessment, or null when anything about it is invalid (never throws). */
export function parseStoredAssessment(value: unknown): StoredAssessment | null {
  if (!isRecord(value)) return null;
  const answers = parseAnswers(value.answers);
  const { completedAt, selectedTrack, ownerOverrodeTrack } = value;
  if (!answers || typeof completedAt !== 'string' || Number.isNaN(Date.parse(completedAt)) || !isTrack(selectedTrack) || typeof ownerOverrodeTrack !== 'boolean') return null;
  return { answers, completedAt, selectedTrack, ownerOverrodeTrack };
}
