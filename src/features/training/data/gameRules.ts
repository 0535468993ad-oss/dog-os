import type { Level, Trophy, TrophyId } from '../types';

// Scoring, anti-cheat limits, levels and trophies. Everything rewards real practice with the dog:
// a live session of 3 minutes, a daily ceiling, and levels that need distinct training days.

/** A command session must run this long before it can be confirmed. */
export const SESSION_MIN_SECONDS = 180;
export const DAILY_XP_CAP = 300;
export const BASE_SESSION_XP = 40;
/** Practising outside, with distractions, is the generalisation step – it earns a little more. */
export const OUTDOOR_BONUS_XP = 10;

export const RAPID_WINDOW_MS = 15_000;
/** More actions than this inside the window freezes scoring. */
export const RAPID_MAX_ACTIONS = 3;
export const FREEZE_MS = 60_000;
export const RAPID_ACTIONS_MESSAGE_HE = 'קצב מהיר מדי! אילוף אמיתי דורש תרגול מעשי בשטח עם הכלב';

/** Streak multipliers, highest threshold first. */
export const STREAK_MULTIPLIERS: readonly { minDays: number; multiplier: number }[] = [
  { minDays: 7, multiplier: 1.5 },
  { minDays: 3, multiplier: 1.2 },
];

/** Ten levels of the dog-and-handler team. From level 4, distinct training days are required too. */
export const LEVELS: readonly Level[] = [
  { level: 1, titleHe: 'גור סקרן', minXp: 0, minActiveDays: 0 },
  { level: 2, titleHe: 'מתלמד', minXp: 100, minActiveDays: 0 },
  { level: 3, titleHe: 'שותף לאימון', minXp: 250, minActiveDays: 0 },
  { level: 4, titleHe: 'מתמיד', minXp: 500, minActiveDays: 3 },
  { level: 5, titleHe: 'צוות מגובש', minXp: 800, minActiveDays: 5 },
  { level: 6, titleHe: 'מיומן', minXp: 1200, minActiveDays: 8 },
  { level: 7, titleHe: 'ממושמע בשטח', minXp: 1700, minActiveDays: 12 },
  { level: 8, titleHe: 'מקצוען', minXp: 2300, minActiveDays: 16 },
  { level: 9, titleHe: 'מאסטר', minXp: 3000, minActiveDays: 21 },
  { level: 10, titleHe: 'אגדה', minXp: 4000, minActiveDays: 30 },
];

export const TROPHIES: Readonly<Record<TrophyId, Trophy>> = {
  'iron-shield': { id: 'iron-shield', nameHe: 'מגן הברזל', descriptionHe: 'שבעה ימי אימון רצופים' },
  'recall-magnet': { id: 'recall-magnet', nameHe: 'מגנט החזרה', descriptionHe: '10 אימוני "אליי", מתוכם 3 בחוץ עם גירויים' },
  'steel-control': { id: 'steel-control', nameHe: 'שליטה מפלדה', descriptionHe: '5 אימונים בכל אחת מהפקודות "הישאר", "רגלי" ו"לא לגעת"' },
  'field-beast': { id: 'field-beast', nameHe: 'חיית שטח', descriptionHe: '15 אימונים בחוץ עם גירויים, ב־5 פקודות שונות לפחות' },
};

/** Sessions kept on the device; older ones are dropped (their XP stays in the total). */
export const MAX_STORED_SESSIONS = 1000;
