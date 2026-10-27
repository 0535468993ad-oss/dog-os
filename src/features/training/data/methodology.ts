import type { CommandMarkers, TemperamentTrait, TrainingTrack } from '../types';

// The two training tracks, their safety rules, the marker vocabulary and the generalisation rule every protocol ends with.

/** One marker vocabulary for all nine commands, so the dog learns once what each word promises. */
export const MARKERS_HE: CommandMarkers = {
  terminal: 'כן!',
  continuation: 'טוב',
  releaseWord: 'חופשי',
};

/** Appended, word for word, as the last step of every command in both tracks. */
export const GENERALIZATION_RULE_HE =
  'לאחר שהכלב מתרגל את הפקודה בסביבה הביתית השקטה וזה מצליח, יוצאים איתו בהדרגה לבלות ולתרגל בסביבה עם גירויים כדי להטמיע את ההתנהגות בכל תנאי.';

export const TRACK_LABELS_HE: Readonly<Record<TrainingTrack, string>> = {
  FORCE_FREE: 'חיזוק חיובי (R+)',
  BALANCED: 'אילוף מאוזן',
};

export const TRACK_SUMMARIES_HE: Readonly<Record<TrainingTrack, string>> = {
  FORCE_FREE: 'מרקר ("כן!" או קליקר), חטיפים ומשחק. אפס כפייה ואפס לחץ רצועה: מתגמלים את מה שרוצים, ומונעים גישה לתגמול כשההתנהגות לא מגיעה.',
  BALANCED: 'בסיס של חיזוק חיובי, ואחריו אכיפה הוגנת: לחץ עדין שמשתחרר ברגע הביצוע (R-) ותיקון מדוד (P+) – רק על התנהגות שהכלב כבר מבין.',
};

/** Bump whenever the rules below change in meaning: owners confirm the new version before balanced content opens. */
export const BALANCED_RULES_VERSION = 2;

/** Shown before the balanced track opens, and confirmed per dog at BALANCED_RULES_VERSION. */
export const BALANCED_SAFETY_RULES_HE: readonly string[] = [
  'קודם מלמדים, אחר כך אוכפים: תיקון לעולם לא מלמד התנהגות חדשה. כלב שלא הבין מקבל עוד הדרכה – לא לחץ.',
  'התזמון הוא הכול: הלחץ משתחרר בשבריר השנייה שבה הכלב מבצע. לחץ שלא משתחרר הוא סתם אי־נוחות.',
  'Slip Lead: גבוה על הצוואר, מאחורי האוזניים, ומשוחרר כשאין צורך. לעולם לא משאירים כלב קשור בו.',
  'קולר פרונג: מותאם במידה, צמוד וגבוה על הצוואר, לא על גורים, לא לחבר לעצם קבוע ולא למשוך בתנופה. לחץ־שחרור קטן בלבד.',
  'קולר אלקטרוני: רק אחרי הכרות מסודרת עם מאלף מוסמך, ברמת הגירוי הנמוכה ביותר שהכלב מרגיש (Working Level – תחושה דמוית TENS). לא כעונש, לא בכעס, ולא יותר מ־8 שעות ביום על הצוואר; מזיזים את נקודות המגע כל שעה–שעתיים.',
  'לפני גיל 6 חודשים לא משתמשים בציוד אוורסיבי, ועד גיל 12 חודשים לא בקולר אלקטרוני ולא בפרונג. בכלב חרדתי או עם תוקפנות מפחד הסיכון גבוה במיוחד: אם בוחרים במסלול, רק בליווי מאלף ואחרי בדיקה אצל וטרינר מומחה להתנהגות.',
  'מה הספרות אומרת: איגודי ההתנהגות הווטרינריים AVSAB (ארה״ב) ו־BSAVA (בריטניה) ממליצים להימנע משיטות אוורסיביות ולא מצאו שהן יעילות יותר. בישראל הציוד חוקי היום; ב־2022 הוגשה הצעת חוק לאסור קולרים חשמליים.',
];

export const TEMPERAMENT_LABELS_HE: Readonly<Record<TemperamentTrait, string>> = {
  ANXIOUS_SENSITIVE: 'חרדתי / רגיש',
  STEADY: 'יציב ומאוזן',
  HIGH_AROUSAL_PREY: 'עוררות גבוהה / דחף ציד קיצוני',
};

export const TEMPERAMENT_HINTS_HE: Readonly<Record<TemperamentTrait, string>> = {
  ANXIOUS_SENSITIVE: 'נבהל מרעשים או מאנשים, מתקשה להירגע, נמנע ממצבים חדשים.',
  STEADY: 'סקרן, מתאושש מהר מבהלה, מגיב לרוב הגירויים ברוגע.',
  HIGH_AROUSAL_PREY: 'נדלק מהר מתנועה, חתולים או כלבים, ומתקשה "לשמוע" כשהוא בעוררות גבוהה.',
};

/** Quiet-structure principles for sensitive dogs: boundaries without pain or leash jerks. */
export const QUIET_STRUCTURE_PRINCIPLES_HE: readonly string[] = [
  'לחץ מרחבי (Spatial Pressure): חוסמים בגוף, בתנועה רגועה, את המעבר שלא רוצים – בלי מגע ובלי קול.',
  'גבולות יציבים: שערים, רצועה באורך קבוע ושגרה צפויה. הכלב יודע מה יקרה, ולכן נרגע.',
  'עצירת התקדמות: כשהכלב מושך – עוצרים ועומדים כמו עץ. ממשיכים רק כשהרצועה רפויה. בלי טלטול רצועה ובלי ענישה מכאיבה.',
  'מתגמלים רוגע: כל רגע של הסתכלות שקטה על גירוי מקבל מרקר וחטיף.',
];
