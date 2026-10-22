import type { AllergyNeed, Dwelling, Experience, PrimaryGoal, Surroundings } from '../types';

// Answer labels for the six-step lifestyle profiler. Numeric answers are honest buckets: people
// overestimate their free time, so the steps ask for the real daily routine.

export const DWELLING_LABELS: Readonly<Record<Dwelling, string>> = {
  APT_NO_ELEVATOR: 'דירה בלי מעלית',
  APT_ELEVATOR: 'דירה עם מעלית',
  GARDEN_APT: 'דירת גן',
  HOUSE: 'בית פרטי עם חצר',
};

export const SURROUNDINGS_LABELS: Readonly<Record<Surroundings, string>> = {
  URBAN_DENSE: 'עיר צפופה',
  QUIET_RURAL: 'יישוב שקט או כפרי',
};

export const ALONE_HOURS_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 2, label: 'עד שעתיים' },
  { value: 4, label: 'כ־4 שעות' },
  { value: 6, label: 'כ־6 שעות' },
  { value: 8, label: 'כ־8 שעות' },
  { value: 10, label: '10 שעות ומעלה' },
];

export const EXERCISE_MINUTES_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 20, label: 'רק יציאות קצרות לצרכים' },
  { value: 45, label: 'כ־45 דקות' },
  { value: 75, label: 'כשעה ורבע' },
  { value: 120, label: 'כשעתיים' },
  { value: 150, label: 'שעתיים וחצי ומעלה' },
];

export const EXPERIENCE_LABELS: Readonly<Record<Experience, string>> = {
  FIRST_TIME: 'כלב ראשון',
  EXPERIENCED: 'גידלתי כלבים בעבר',
  WORKING_HANDLER: 'מוביל/ת כלבי עבודה או ספורט',
};

export type HouseholdKey = 'infantsOrToddlers' | 'olderKids' | 'catsOrSmallPets';

export const HOUSEHOLD_LABELS: Readonly<Record<HouseholdKey, string>> = {
  infantsOrToddlers: 'תינוקות או פעוטות',
  olderKids: 'ילדים מעל גיל 6',
  catsOrSmallPets: 'חתולים או חיות קטנות',
};

export const ALLERGY_LABELS: Readonly<Record<AllergyNeed, string>> = {
  STRICT_HYPOALLERGENIC: 'יש אלרגיה – חייבים פרווה שלא נושרת',
  PREFER_LOW_SHEDDING: 'מעדיפים מעט שיער בבית',
  NO_CONCERN: 'שיער על הספה לא מפריע',
};

export const BUDGET_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 400, label: 'עד 400 ₪' },
  { value: 700, label: 'כ־700 ₪' },
  { value: 1000, label: 'כ־1,000 ₪' },
  { value: 1500, label: 'כ־1,500 ₪' },
  { value: 2500, label: '2,500 ₪ ומעלה' },
];

export const GOAL_LABELS: Readonly<Record<PrimaryGoal, string>> = {
  COUCH_COMPANION: 'חבר רגוע לספה',
  FAMILY_BUDDY: 'כלב משפחה',
  ATHLETE: 'שותף לריצות וטיולים',
  WORKING_DRIVE: 'ציות מתקדם, ספורט או עבודה',
};

export const QUIZ_STEP_TITLES_HE: readonly string[] = [
  'איפה הכלב יגור?',
  'כמה זמן ואנרגיה יש לכם באמת?',
  'ניסיון ומי גר בבית',
  'פרווה ואלרגיות',
  'תקציב חודשי',
  'מה אתם מחפשים בכלב?',
];

/** The honest note shown next to the allergy question. */
export const HYPOALLERGENIC_NOTE_HE =
  'אין כלב היפואלרגני באמת: האלרגן העיקרי (Can f 1) נמצא ברוק ובקשקשים, לא רק בשיער. פרווה שלא נושרת מפזרת פחות – כדאי לבלות זמן עם כלב מהגזע לפני ההחלטה.';
