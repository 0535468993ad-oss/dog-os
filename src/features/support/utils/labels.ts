import type { SupportRequestStatus, SupportRequestType } from '@/lib/database.types';

import type { SupportBadgeTone } from '../types';

export const REQUEST_TYPE_LABELS: Record<SupportRequestType, string> = {
  privacy_access: 'עיון במידע שלי',
  privacy_correction: 'תיקון מידע',
  privacy_deletion: 'מחיקת מידע',
  privacy_objection: 'התנגדות לעיבוד',
  accessibility: 'בעיית נגישות',
  general: 'פנייה כללית',
};

export const REQUEST_STATUS_LABELS: Record<SupportRequestStatus, string> = {
  open: 'התקבלה',
  in_progress: 'בטיפול',
  closed: 'טופלה',
};

export const STATUS_TONE: Record<SupportRequestStatus, SupportBadgeTone> = {
  open: 'info',
  in_progress: 'warning',
  closed: 'success',
};

/** Guidance shown under the type picker, pointing to self-service where it exists. */
export const TYPE_HINTS: Partial<Record<SupportRequestType, string>> = {
  privacy_access: 'אפשר גם לייצא את כל המידע מיד: פרופיל ← ״ייצוא המידע שלי״.',
  privacy_correction: 'רוב המידע ניתן לעריכה ישירה באפליקציה. פרטו כאן מה לא הצלחתם לתקן.',
  privacy_deletion: 'מחיקת החשבון וכל המידע זמינה מיד: פרופיל ← ״מחיקת החשבון״. כאן ניתן לבקש מחיקה חלקית.',
  accessibility: 'תארו את המסך, המכשיר והטכנולוגיה המסייעת (למשל קורא מסך) שבה השתמשתם.',
};

export const TYPE_OPTIONS = (Object.keys(REQUEST_TYPE_LABELS) as SupportRequestType[]).map((value) => ({ value, label: REQUEST_TYPE_LABELS[value] }));

/** Narrows a route param to a request type. */
export function isSupportRequestType(value: unknown): value is SupportRequestType {
  // Own keys only: `in` would also accept inherited names such as "constructor".
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(REQUEST_TYPE_LABELS, value);
}
