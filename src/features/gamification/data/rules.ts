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

/** The late-evening streak rescue: a 60-second touch drill, worth a little, on a day with no XP yet. */
export const RESCUE_MIN_SECONDS = 60;
export const RESCUE_COMMAND_ID = 'touch';
export const RESCUE_XP = 30;
export const RESCUE_START_HOUR = 20;

/** A confirmed session in a yard or quiet park: between home and the street. */
export const YARD_SESSION_XP = 125;

/** Reps closer together than this are spam, not training: they count towards the rapid-action freeze. */
export const REP_MIN_INTERVAL_MS = 4000;
/** A pause this long ends the combo. */
export const COMBO_RESET_MS = 45_000;
export const REP_XP = 5;
/** Rep XP a single session can bank, so a long session cannot flood the day's cap with taps. */
export const REP_SESSION_MAX_XP = 60;
/** Combo tiers, highest first: reps in a row → multiplier on each rep's XP. */
export const COMBO_TIERS: readonly { minCombo: number; multiplier: number }[] = [
  { minCombo: 8, multiplier: 5 },
  { minCombo: 5, multiplier: 3 },
  { minCombo: 3, multiplier: 2 },
  { minCombo: 0, multiplier: 1 },
];

/** Time-of-day quests and the weekly boss. */
export const QUEST_BONUS_MULTIPLIER = 1.2;
export const BOSS_MULTIPLIER = 2;

/** Loot: drop rates, the pity timer and the shield reserve. */
export const LOOT_COMMON_RATE = 0.6;
export const LOOT_RARE_RATE = 0.3;
/** After this many boxes without a rare, the next box is rare or better. */
export const LOOT_PITY_THRESHOLD = 4;
export const MAX_STREAK_SHIELDS = 3;
