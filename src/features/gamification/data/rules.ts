// Scoring and anti-cheat limits. Everything rewards real practice with the dog: a live session of three
// minutes, a daily ceiling, and ranks that need distinct training days (see ranksData).

/** A command session must run this long before it can be confirmed. */
export const SESSION_MIN_SECONDS = 180;
export const DAILY_XP_CAP = 300;

/** A checked training step – only while a live session runs, once per step per session. */
export const STEP_XP = 25;
/** A confirmed command session at home. */
export const COMMAND_XP = 100;
/** A confirmed session outside, with distractions: the generalisation step earns more. */
export const OUTDOOR_SESSION_XP = 150;

export const RAPID_WINDOW_MS = 15_000;
/** More actions than this inside the window freezes scoring. */
export const RAPID_MAX_ACTIONS = 3;
export const FREEZE_MS = 60_000;
export const RAPID_ACTIONS_MESSAGE_HE = 'קצב מהיר מדי! אילוף אמיתי דורש תרגול מעשי בשטח עם הכלב';

/** Streak multipliers, highest threshold first: 1.5× from 7 days, 1.2× from 3, otherwise 1×. */
export const STREAK_MULTIPLIERS: readonly { minDays: number; multiplier: number }[] = [
  { minDays: 7, multiplier: 1.5 },
  { minDays: 3, multiplier: 1.2 },
];

/** Sessions kept on the device; older ones are dropped (their XP and days stay counted). */
export const MAX_STORED_SESSIONS = 1000;
