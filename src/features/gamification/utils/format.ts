import type { CompletionOutcome } from '../types';
import { DAILY_XP_CAP, RAPID_ACTIONS_MESSAGE_HE, SESSION_MIN_SECONDS } from '../data/rules';

/** "2:05" – minutes and zero-padded seconds. */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** The user-facing message for a completion outcome, or null when it needs none. */
export function outcomeMessageHe(outcome: CompletionOutcome): string | null {
  if (outcome.blocked === 'RAPID_ACTIONS' || outcome.blocked === 'FROZEN') return RAPID_ACTIONS_MESSAGE_HE;
  if (outcome.blocked === 'SESSION_TOO_SHORT') return `אימון נרשם רק אחרי ${SESSION_MIN_SECONDS / 60} דקות של תרגול חי (60 שניות בתרגיל חילוץ הרצף).`;
  if (outcome.blocked === 'TRACK_NOT_ALLOWED') return 'המסלול המאוזן לא זמין כרגע לכלב הזה – האימון לא נרשם.';
  if (outcome.blocked === 'RESCUE_NOT_AVAILABLE') return 'תרגיל חילוץ הרצף פתוח רק בין 20:00 לחצות, ביום שעוד לא נצבר בו XP.';
  if (outcome.xpAwarded === 0) return `הגעתם לתקרה היומית (${DAILY_XP_CAP} XP). האימון נרשם, והניקוד מתחדש מחר.`;
  if (outcome.capped) return `קיבלתם ${outcome.xpAwarded} XP – הגעתם לתקרה היומית (${DAILY_XP_CAP} XP).`;
  return null;
}
