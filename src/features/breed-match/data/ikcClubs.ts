import type { ClubId, IkcClub } from '../types';

// The Israel Kennel Club (ההתאחדות הישראלית לכלבנות) is the FCI member for Israel; its breed clubs
// (חוגים) keep breeding rules, health requirements and litter lists. Club contacts change, so the app
// points to the federation's office rather than storing phone numbers.

export const IKC_WEBSITE = 'https://www.ikc.org.il';

export const IKC_CLUBS: Readonly<Record<ClubId, IkcClub>> = {
  shepherd: { id: 'shepherd', nameHe: 'החוג הישראלי לכלבי רועים', scopeHe: 'רועה גרמני, רועים בלגיים, בורדר קולי, רועה אוסטרלי ורועים נוספים' },
  retriever: { id: 'retriever', nameHe: 'מועדון הרטריבר הישראלי', scopeHe: 'גולדן רטריבר, לברדור רטריבר ושאר הרטריברים' },
  'working-sport': { id: 'working-sport', nameHe: 'החוג הישראלי לכלבי עבודה וספורט', scopeHe: 'בוקסר, קנה קורסו וגזעי עבודה ושמירה' },
  toy: { id: 'toy', nameHe: 'החוג הישראלי לכלבים זעירים', scopeHe: 'כלבי חברה וזעירים: בולדוג צרפתי, פודל, קבליר, שיצו, צ׳יוואווה' },
  spitz: { id: 'spitz', nameHe: 'החוג הישראלי לכלבי שפיץ', scopeHe: 'הכלב הכנעני (גזע ישראלי מוכר ב־FCI), פומרניאן ושפיצים נוספים' },
};

/** Why "purebred without papers" is not a bargain. */
export const ANTI_SCAM_POINTS_HE: readonly string[] = [
  'תעודת יוחסין רשמית של ההתאחדות (FCI) עולה למגדל בערך 150–200 ₪ לגור. מי שמוכר "גזעי בלי תעודות" לא חוסך לכם כסף – הוא חוסך לעצמו פיקוח.',
  'בלי תעודות אין שום ודאות שההורים עברו צילומי אגן, בדיקות לב או DNA – ומחלות תורשתיות יתגלו אצלכם, בעלות שלכם.',
  'בלי רישום אין מעקב אחרי קרבת משפחה: רבייה בתוך המשפחה מגבירה מחלות ובעיות מזג.',
  'מגדל שמוכר דרך יד 2 או מגיע אליכם לחניון – לא מראה לכם איפה הגורים גדלו. זה סימן מובהק למטחנת גורים.',
];

/** What to verify on site before paying an IKC breeder. */
export const BREEDER_AUDIT_CHECKLIST_HE: readonly string[] = [
  'לראות את האם במקום, עם הגורים – ולהתרשם מהמזג שלה מול אנשים זרים',
  'גורים נמסרים לא לפני גיל 8 שבועות – לא "כבר בגיל 6, הם אוכלים לבד"',
  'לראות את המקורות של בדיקות ההורים (אגן, מרפקים, לב, עיניים, DNA) – לא צילום מסך ולא "יש לנו בבית"',
  'תעודת יוחסין של ההתאחדות לשני ההורים, ורישום ההמלטה בהתאחדות',
  'פנקס חיסונים, שבב ותילוע לפי הגיל',
  'מגדל טוב שואל אתכם שאלות, ומתחייב להחזיר את הכלב אליו אם לא תוכלו להמשיך לגדל אותו',
];
