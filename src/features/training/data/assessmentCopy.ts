import type { BalancedGate, NerveProfile, PrimaryMotivator, RiskId, RiskWarning } from '../types';

// Copy for the calibrated recommendation: the targeted warnings (versioned), the gate each one sets,
// the reasons, principles and per-dog adjustments. Reasons describe this dog – they never claim that one
// method is more effective than another.

/** Each warning, by id. Bump `version` when the meaning changes, so owners confirm it again. */
export const RISK_WARNINGS: Readonly<Record<RiskId, RiskWarning>> = {
  PUPPY_FLOOR: {
    id: 'PUPPY_FLOOR',
    version: 1,
    severity: 'BLOCKING',
    textHe: 'לפני גיל 6 חודשים לא משתמשים בציוד אוורסיבי: זו תקופת הסוציאליזציה, ופחד שנלמד עכשיו נוטה להישאר. בונים יסודות בתגמול, במשחק ובגבולות סביבתיים.',
  },
  SENSITIVE_NERVE: {
    id: 'SENSITIVE_NERVE',
    version: 1,
    severity: 'HIGH',
    textHe: 'הכלב נראה רגיש: לחץ ותיקונים עלולים להגביר פחד, להוביל להסתגרות או לתוקפנות מפחד. אם בוחרים בכל זאת במסלול המאוזן – רק בליווי מאלף מקצועי, בלחץ המינימלי, ועם מעקב אחרי סימני מצוקה.',
  },
  FEAR_REACTIVE: {
    id: 'FEAR_REACTIVE',
    version: 1,
    severity: 'HIGH',
    textHe: 'בהלה שמתאוששת לאט יחד עם התפרצויות מול גירויים מתאימה לתגובתיות על רקע פחד. מומלץ להתחיל בבדיקה אצל וטרינר מומחה להתנהגות, לפני כל ציוד אכיפה.',
  },
  ADOLESCENT: {
    id: 'ADOLESCENT',
    version: 1,
    severity: 'CAUTION',
    textHe: 'גיל ההתבגרות (מ־6 ועד 12 חודשים): ירידה זמנית בהקשבה היא שלב התפתחותי, לא התרסה. עד גיל 12 חודשים לא משתמשים בקולר אלקטרוני או בפרונג, ועובדים בליווי מאלף.',
  },
  NOVICE_TIMING: {
    id: 'NOVICE_TIMING',
    version: 1,
    severity: 'CAUTION',
    textHe: 'בכלב הראשון קשה לתזמן לחץ ושחרור בשבריר שנייה, ולחץ בתזמון שגוי מבלבל את הכלב. ציוד אכיפה – רק אחרי הדרכה מעשית עם מאלף.',
  },
  HIGH_AROUSAL: {
    id: 'HIGH_AROUSAL',
    version: 1,
    severity: 'CAUTION',
    textHe: 'בעוררות גבוהה הכלב מתקשה לעבד גם תגמול וגם תיקון. קודם מורידים עוררות (מרחק, פריקה, עבודה מתחת לסף), ורק אז אוכפים – בליווי מאלף.',
  },
  UNKNOWN_AGE: {
    id: 'UNKNOWN_AGE',
    version: 1,
    severity: 'INFO',
    textHe: 'גיל הכלב לא ידוע. הוסיפו תאריך לידה בפרופיל, כדי שההמלצה תתאים לשלב ההתפתחותי.',
  },
};

/** The gate each warning sets; the dog's gate is the most restrictive one that applies. */
export const RISK_GATES: Readonly<Record<RiskId, BalancedGate>> = {
  PUPPY_FLOOR: 'LOCKED',
  SENSITIVE_NERVE: 'ADVISED_AGAINST',
  FEAR_REACTIVE: 'ADVISED_AGAINST',
  ADOLESCENT: 'PROFESSIONAL_ADVISED',
  NOVICE_TIMING: 'PROFESSIONAL_ADVISED',
  HIGH_AROUSAL: 'PROFESSIONAL_ADVISED',
  UNKNOWN_AGE: 'OPEN',
};

export const GATE_LABELS_HE: Readonly<Record<BalancedGate, string>> = {
  LOCKED: 'המסלול המאוזן סגור בגיל הזה',
  ADVISED_AGAINST: 'המסלול המאוזן לא מומלץ לכלב הזה – אפשרי באחריותכם, עם אזהרות',
  PROFESSIONAL_ADVISED: 'המסלול המאוזן אפשרי בליווי מאלף מקצועי',
  OPEN: 'שני המסלולים פתוחים',
};

export const MOTIVATOR_LABELS_HE: Readonly<Record<PrimaryMotivator, string>> = {
  HIGH_VALUE_FOOD: 'מונע אוכל',
  TUG_AND_PREY_TOY: 'מונע משחק וטרף',
  HYBRID_REWARD: 'משלב אוכל ומשחק',
};

export const NERVE_LABELS_HE: Readonly<Record<NerveProfile, string>> = {
  SENSITIVE_SOFT: 'רגיש ועדין',
  BALANCED_STABLE: 'יציב ומאוזן',
  HARD_HIGH_DRIVE: 'קשוח ובעל דחף גבוה',
};

export const TITLES_HE = {
  sensitive: 'חיזוק חיובי עם מבנה שקט',
  young: 'חיזוק חיובי – בונים יסודות',
  balanced: 'מסלול מאוזן, בליווי מאלף מקצועי',
  balancedExperienced: 'מסלול מאוזן: בסיס של תגמול ומבנה ברור',
  forceFree: 'חיזוק חיובי',
} as const;

export const REASONS_HE = {
  puppy: 'עוד לא בן 6 חודשים – בונים יסודות בתגמול ובמשחק.',
  young: 'לפני גיל 12 חודשים הגוף והביטחון עוד מתפתחים – מתחילים בחיזוק חיובי.',
  sensitiveA: 'בכלב חרדתי, לחץ וכאב מגבירים פחד ועלולים להוביל לתוקפנות מפחד.',
  sensitiveB: 'מה שבונה ביטחון: הצלחות קטנות, צפיות וגבולות יציבים.',
  arousal: 'בעוררות גבוהה הכלב לא תמיד "שומע" תגמול. מסגרת ברורה של לחץ ושחרור היא אחת הדרכים לעבוד על ביצוע ברגעים קריטיים – קריאה ליד כביש, עצירה מול חתול.',
  pushesThrough: 'מתעלם מ"לא" תקיף וממשיך: כלב כזה צריך גבולות ברורים ועקביים, בתזמון מדויק.',
  reliability: 'המטרה שלכם דורשת ביצוע גם בהסחות חזקות; המסלול המאוזן מוסיף שכבה של מבנה מעל בסיס התגמול.',
  foundation: 'הבסיס נשאר חיזוק חיובי: כל פקודה נלמדת קודם בתגמול.',
  evidence: 'שימו לב: איגודי ההתנהגות הווטרינריים ממליצים לנסות קודם ניהול סביבה ועבודה על סף העוררות.',
  stable: 'כלב יציב לומד מהר ובהנאה עם מרקר ותגמול – זה המסלול המומלץ כברירת מחדל.',
} as const;

export const R_PLUS_PRINCIPLES_HE: readonly string[] = [
  'מרקר מדויק ("כן!") ותגמול תוך שנייה.',
  'אימונים קצרים של 3–5 דקות, ומסיימים בהצלחה.',
  'מעלים קושי בהדרגה: קודם בבית, אחר כך בחוץ.',
];

export const SELF_CONTROL_PRINCIPLE_HE = 'משחקי שליטה עצמית (התאפקות לפני משחק) מגיל צעיר.';

export const BALANCED_PRINCIPLES_HE: readonly string[] = [
  'עבודה מתחת לסף: מתרגלים במרחק שבו הכלב עוד מסוגל להגיב.',
  'לחץ קטן שמשתחרר ברגע הביצוע – לא עונש.',
  'יציאה לפעילות פיזית ומחשבתית לפני האימון, כדי להוריד עוררות.',
];

export const ADJUSTMENTS_HE = {
  playReward: 'תגמול במשחק: כדור או משיכה (Tug) שווים לו יותר מחטיף יבש – השתמשו בהם כתגמול על ביצוע.',
  foodReward: 'חטיפים בעלי ערך גבוה עובדים מצוין – שמרו את הטובים ביותר לתרגול בחוץ.',
  clarity: 'בהירות לפני הכול: רצועה באורך קבוע, גבולות מרחביים ומרקר עקבי, כדי שהכלב יבין בדיוק מה מבוקש.',
  energy: 'פריקה פיזית ומחשבתית לפני האימון מורידה עוררות ומשפרת ריכוז.',
  distance: 'ברחוב מתחילים במרחק גדול מהגירויים, ומתגמלים כל מבט אליכם.',
  city: 'בעיר סואנת: הרבה תרגול של "מקום" ורוגע ליד גירויים, בהדרגה.',
} as const;
