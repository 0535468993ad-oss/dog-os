import type { Precondition, TemperamentProfile, TemperamentProfileId, VolhardTest } from '../types';
import { VOLHARD_DRIVE_SENSORY_TESTS } from './volhardDriveSensoryTests';
import { VOLHARD_SOCIAL_TESTS } from './volhardSocialTests';

/** The ten Volhard tests in protocol order. */
export const VOLHARD_TESTS: readonly VolhardTest[] = [...VOLHARD_SOCIAL_TESTS, ...VOLHARD_DRIVE_SENSORY_TESTS];

/** Conditions that must all hold before the test means anything. */
export const VOLHARD_PRECONDITIONS: readonly Precondition[] = [
  {
    id: 'age',
    titleHe: 'גיל מדויק: יום 49 (7 שבועות)',
    detailHe: 'חלון מקובל: ימים 48–50. לפני כן מערכת העצבים עוד לא בשלה; אחרי כן מתחילה תקופת רגישות לפחד, והתוצאה משקפת חוויות ולא מזג.',
  },
  {
    id: 'neutral-tester',
    titleHe: 'בודק ניטרלי',
    detailHe: 'אדם זר לגור לחלוטין – לא המגדל, שהגור מכיר, ולא הקונה, שרוצה כבר גור מסוים.',
  },
  {
    id: 'isolated-room',
    titleHe: 'חדר שקט ולא מוכר',
    detailHe: 'חלל סגור ושקט של כ־3×3 מ׳, בלי האם, בלי האחים ובלי ריחות וקולות של ההמלטה.',
  },
  {
    id: 'physiological-balance',
    titleHe: 'גור במצב גופני מאוזן',
    detailHe: 'ער ועירני, לא רעב ולא מיד אחרי ארוחה כבדה, לא עייף ולא אחרי חיסון או טיפול באותו יום.',
  },
];

export const TEMPERAMENT_PROFILES: Readonly<Record<TemperamentProfileId, TemperamentProfile>> = {
  1: {
    id: 1,
    titleHe: 'פרופיל עבודה קיצוני – דחף גבוה ותגובתיות חזקה',
    summaryHe: 'סף גירוי נמוך, דחפים חזקים ותגובה עוצמתית לתסכול. מתאים לעבודה מבצעית ולספורט תחרותי.',
    bestHomeHe: 'מוביל מקצועי של כלבי עבודה, עם תוכנית אימון יומית ומסגרת ברורה.',
    notForHe: 'לא לבעלים מתחילים ולא לבית עם ילדים צעירים.',
  },
  2: {
    id: 2,
    titleHe: 'פרופיל אסרטיבי ואתלטי',
    summaryHe: 'גור בטוח, אנרגטי ונחוש, עם דחף לחפצים ולמשחק. לומד מהר כשהלמידה מתגמלת.',
    bestHomeHe: 'בעלים מנוסים, עם גבולות עקביים, אימון חיובי ופעילות ספורטיבית.',
    notForHe: 'לא לבית שבו הכלב יישאר שעות ארוכות בלי תעסוקה.',
  },
  3: {
    id: 3,
    titleHe: 'הפרופיל המאוזן הקלאסי',
    summaryHe: 'חברותי, סקרן ומשתף פעולה, עם התאוששות מהירה מבהלה ומתסכול.',
    bestHomeHe: 'משפחה, כלב חברה ואילוף – מתאים לרוב הבתים, גם לבעלים בפעם הראשונה.',
    notForHe: 'עדיין צריך חשיפה חברתית ואילוף – מזג טוב הוא נקודת התחלה, לא הבטחה.',
  },
  4: {
    id: 4,
    titleHe: 'פרופיל רך וסובלני',
    summaryHe: 'עדין, מקבל מגע בקלות ומבקש קרבה. מגיב טוב לקול רך ולתגמול.',
    bestHomeHe: 'משפחה עם ילדים, אנשים מבוגרים, כלב טיפולי – עם הדרכה חיובית ועדינה.',
    notForHe: 'לא לשיטות אילוף כוחניות – הוא ייסגר ויאבד ביטחון.',
  },
  5: {
    id: 5,
    titleHe: 'פרופיל רגיש וחששן – סף גירוי נמוך',
    summaryHe: 'נבהל בקלות וזקוק לזמן ארוך יותר כדי להתאושש מגירוי חדש.',
    bestHomeHe: 'בית שקט וצפוי, עם תוכנית הרגלה הדרגתית (דה־סנסיטיזציה) והתניה נגדית.',
    notForHe: 'לא לבית רועש עם הרבה אורחים, ולא לעיר צפופה בלי ליווי מקצועי.',
  },
  6: {
    id: 6,
    titleHe: 'פרופיל עצמאי או נמנע',
    summaryHe: 'מעט עניין באנשים, או הימנעות מהם. עשוי להיות עצמאי מאוד – או בעקה גבוהה.',
    bestHomeHe: 'בעלים שמוכנים לעבוד עם יועץ התנהגות מוסמך מהיום הראשון.',
    notForHe: 'לא כ"כלב משפחה" ולא לבעלים שמצפים לקשר מהיר.',
  },
};
