import type { AdoptionCheckItem, DecompressionStage } from '../types';

// How to read an adult shelter or foster dog fairly, and safely. Kennel stress (sensory flooding)
// suppresses some behaviours and amplifies others, so nothing seen behind the bars is a verdict.

export const DECOMPRESSION_STAGES: readonly DecompressionStage[] = [
  {
    id: 'days',
    titleHe: '3 ימים – הלם חושי',
    bodyHe: 'רמות הקורטיזול עוד גבוהות. הכלב עלול לא לאכול, להסתתר או להיות "מושלם" באופן חשוד. לא מארחים, לא מטיילים בעומס, נותנים פינה שקטה ומים.',
  },
  {
    id: 'weeks',
    titleHe: '3 שבועות – לומדים את השגרה',
    bodyHe: 'הכלב מבין מתי אוכלים, מתי יוצאים ומי גר בבית. עכשיו מתחילות לצוץ התנהגויות אמיתיות – זה הזמן לגבולות עקביים ולאימון קצר וחיובי.',
  },
  {
    id: 'months',
    titleHe: '3 חודשים – האישיות מתייצבת',
    bodyHe: 'הכלב מרגיש בבית ומראה את מי שהוא באמת. רוב "הבעיות" של השבוע הראשון נעלמות; מה שנשאר – עובדים עליו עם מאלף.',
  },
];

export const ADULT_ASSESSMENT_CHECKLIST: readonly AdoptionCheckItem[] = [
  {
    id: 'out-of-kennel',
    titleHe: 'פוגשים את הכלב מחוץ לכלוב',
    detailHe: 'לעולם לא שופטים כלב בתוך כלבייה רועשת. יוצאים להליכה של כ־25 דקות באזור שקט ונייטרלי, עד שהנשימה נרגעת והכלב מתחיל לרחרח.',
    critical: true,
  },
  {
    id: 'no-hand-in-bowl',
    titleHe: 'שמירת משאבים – רק בתצפית, ממרחק',
    detailHe: 'אסור להכניס יד לקערת האוכל של כלב מקלט. צופים ממרחק בטוח או שואלים את בית האומנה: קפיאה, "עין לוויתן" (לבן העין נראה), גוף נוקשה, ליקוק שפתיים או אכילה מואצת.',
    critical: true,
  },
  {
    id: 'parallel-walk',
    titleHe: 'מפגש עם כלב – בהליכה מקבילה',
    detailHe: 'הולכים במקביל לכלב ניטרלי ורגוע, במרחק של כ־10 מ׳, ומצמצמים בהדרגה. אין מפגש אף מול אף ברצועה מתוחה – זה מייצר מתח גם אצל כלב חברותי.',
    critical: true,
  },
  {
    id: 'body-language',
    titleHe: 'קוראים שפת גוף לאורך המפגש',
    detailHe: 'גוף רפוי, זנב בגובה טבעי ורחרוח – סימנים טובים. פיהוק, ליקוק שפתיים, ניעור גוף וגוף מורכן – סימני עקה שמצריכים הפסקה.',
    critical: false,
  },
  {
    id: 'foster-report',
    titleHe: 'מבקשים דיווח מבית האומנה',
    detailHe: 'ניקיון בבית, זמן לבד, תגובה לילדים, לכלבים, לחתולים ולמבקרים, ומה מלחיץ אותו.',
    critical: false,
  },
  {
    id: 'medical',
    titleHe: 'בדיקות רפואיות לפני ההחלטה',
    detailHe: 'בדיקת דם לליישמניה ולארליכיה, אישור חיסונים, שבב ועיקור/סירוס – וכל היסטוריה רפואית ידועה.',
    critical: false,
  },
  {
    id: 'household-meeting',
    titleHe: 'מפגש עם כל בני הבית',
    detailHe: 'כולם פוגשים את הכלב לפני ההחלטה – בשטח נייטרלי, בלי לחץ ובלי חיבוקים. הכלב בוחר את הקצב.',
    critical: false,
  },
];
