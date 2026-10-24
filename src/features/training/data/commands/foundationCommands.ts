import type { GearItem, TrainingCommand } from '../../types';
import { GENERALIZATION_RULE_HE } from '../methodology';

// Commands 1–3: sit, down, stay. Pure reward-based training: no physical force, no leash jerks. Mark
// the exact instant the behaviour happens, and deliver the reward within 1–2 seconds.

const POUCH: GearItem = { nameHe: 'פאוץ׳ חטיפים על החגורה', noteHe: 'חטיפים קטנים ורכים, בגודל אפונה' };
const MARKER: GearItem = { nameHe: 'קליקר או מילת מרקר ("כן!")' };

export const FOUNDATION_COMMANDS: readonly TrainingCommand[] = [
  {
    id: 'sit',
    order: 1,
    nameHe: 'שב',
    nameEn: 'Sit',
    cueHe: 'שב',
    category: 'FOUNDATION_OBEDIENCE',
    difficulty: 'BEGINNER',
    xpReward: 100,
    targetGoal: 'הכלב מוריד ישבן לרצפה ונשאר עד מילת השחרור – הבסיס לכל שליטה עצמית.',
    prerequisites: [],
    gear: [POUCH, MARKER, { nameHe: 'רצועה רגילה 1.8 מ׳' }],
    steps: [
      { stepIndex: 1, titleHe: 'פיתוי', instructionHe: 'חטיף מול האף, ומעלים אותו לאט מעל הראש ואחורה. הראש עולה – הישבן יורד.', markerCue: 'ברגע שהישבן נוגע ברצפה', durationSec: 60 },
      { stepIndex: 2, titleHe: 'יד ריקה', instructionHe: 'אחרי 5–8 הצלחות – אותה תנועה בלי חטיף ביד. התגמול מגיע מהיד השנייה, תוך 1–2 שניות.', markerCue: 'ברגע שהישבן נוגע ברצפה', durationSec: 60 },
      { stepIndex: 3, titleHe: 'מילה', instructionHe: 'אומרים "שב" פעם אחת, רגע לפני תנועת היד, ומצמצמים את התנועה בהדרגה.', markerCue: 'ברגע הישיבה אחרי המילה', durationSec: 60 },
      { stepIndex: 4, titleHe: 'משך', instructionHe: 'מחכים 2–5 שניות בישיבה לפני המרקר, ומשחררים במילה קבועה ("חופשי").', markerCue: 'בסוף המשך, כשהכלב עדיין יושב', durationSec: 90 },
    ],
    commonMistakes: ['לחיצה על הגב או על האגן – כואב למפרקים ומלמד התנגדות.', 'חזרה על "שב שב שב" – הכלב לומד שהמילה הראשונה לא קובעת.', 'תגמול אחרי שהכלב כבר קם – מתגמלים את הקימה, לא את הישיבה.'],
    environmentalGeneralization: `מתרגלים בחדרים שונים, ואז במרפסת ובחצר, עם הסחה קטנה אחת בכל פעם. ${GENERALIZATION_RULE_HE}`,
    anxiousDogAdjustmentHe: 'לכלב חרדתי: מתאמנים בפינה מוכרת ושקטה, לא רוכנים מעליו ולא מושיטים יד מעל הראש. עומדים קצת בצד, גוף רגוע, ואימונים של 2–3 דקות.',
  },
  {
    id: 'down',
    order: 2,
    nameHe: 'ארצה',
    nameEn: 'Down',
    cueHe: 'ארצה',
    category: 'IMPULSE_CONTROL',
    difficulty: 'BEGINNER',
    xpReward: 100,
    targetGoal: 'הכלב שוכב על הבטן ונשאר רגוע – תנוחה של מנוחה ושל ויסות עוררות.',
    prerequisites: ['sit'],
    gear: [POUCH, MARKER, { nameHe: 'שטיחון אימון', noteHe: 'משטח נעים מקל על הכלב לשכב' }],
    steps: [
      { stepIndex: 1, titleHe: 'פיתוי לרצפה', instructionHe: 'מהישיבה, מורידים חטיף לאט מהאף ישר לרצפה, בין הכפות, ומושכים מעט קדימה.', markerCue: 'ברגע שהמרפקים נוגעים ברצפה', durationSec: 60 },
      { stepIndex: 2, titleHe: 'תגמול בתנוחה', instructionHe: 'החטיף ניתן בין הכפות – כך הכלב נשאר למטה. כמה חטיפים ברצף בשכיבה עצמה.', markerCue: 'כשהכלב עדיין שוכב', durationSec: 60 },
      { stepIndex: 3, titleHe: 'יד ריקה ומילה', instructionHe: 'אות יד בלי חטיף, ואחר כך המילה "ארצה" רגע לפני התנועה.', markerCue: 'ברגע השכיבה אחרי המילה', durationSec: 60 },
      { stepIndex: 4, titleHe: 'רוגע', instructionHe: 'מאריכים את השכיבה ומתגמלים נשימה רגועה וראש מונח.', markerCue: 'כשהגוף מתרפה – ראש יורד, נשימה איטית', durationSec: 120 },
    ],
    commonMistakes: ['דחיפת הכתפיים או משיכת הכפות.', 'תרגול על משטח קר או קשה – כלב רגיש יעדיף לא לשכב.', 'שחרור לפני שהכלב נרגע – מתגמלים את הדריכות.'],
    environmentalGeneralization: `מתרגלים על משטחים שונים: שטיח, דשא, ספסל בגינה. ${GENERALIZATION_RULE_HE}`,
    anxiousDogAdjustmentHe: 'שכיבה היא תנוחה פגיעה. לכלב חרדתי מציעים משטח רך עם גב לקיר, לא רוכנים מעליו, ומתגמלים בהתחלה גם חצי שכיבה.',
  },
  {
    id: 'stay',
    order: 3,
    nameHe: 'הישאר',
    nameEn: 'Stay',
    cueHe: 'הישאר',
    category: 'IMPULSE_CONTROL',
    difficulty: 'INTERMEDIATE',
    xpReward: 100,
    targetGoal: 'הכלב נשאר בתנוחה עד מילת השחרור, גם כשמתרחקים ממנו ויש הסחות – לפי שלושת ה־D.',
    prerequisites: ['sit', 'down'],
    gear: [POUCH, MARKER, { nameHe: 'רצועה רגילה 1.8 מ׳', noteHe: 'ובהמשך רצועה ארוכה לעבודה על מרחק' }],
    steps: [
      { stepIndex: 1, titleHe: 'משך (Duration)', instructionHe: 'בישיבה, "הישאר", סופרים 2 שניות ומתגמלים במקום. מוסיפים שניות בהדרגה.', markerCue: 'בסוף הזמן, כשהכלב עדיין בתנוחה', durationSec: 90 },
      { stepIndex: 2, titleHe: 'מרחק (Distance)', instructionHe: 'חוזרים לזמן קצר וצועדים צעד אחד אחורה. חוזרים אל הכלב לתגמל – לא קוראים לו.', markerCue: 'כשחוזרים אליו והוא עדיין במקום', durationSec: 90 },
      { stepIndex: 3, titleHe: 'הסחה (Distraction)', instructionHe: 'זמן ומרחק קצרים, והסחה קטנה – מחיאת כף, חטיף שנופל.', markerCue: 'ברגע שהכלב מתעלם מההסחה', durationSec: 90 },
      { stepIndex: 4, titleHe: 'שחרור', instructionHe: 'תמיד מסיימים במילת שחרור קבועה. כלב שקם לפני – לא מקבל, ומתחילים שוב קל יותר.', markerCue: 'לפני מילת השחרור, לא אחריה', durationSec: 60 },
    ],
    commonMistakes: ['להעלות שני מימדים יחד – למשל מרחק והסחה באותו אימון.', 'לקרוא לכלב מה"הישאר" – זה מלמד לשבור את התנוחה.', 'כעס כשהכלב קם: הכשל אומר שהקריטריון גבוה מדי.'],
    environmentalGeneralization: `בונים כל D מחדש בכל מקום חדש – בהתחלה עם זמן ומרחק קצרים. ${GENERALIZATION_RULE_HE}`,
    anxiousDogAdjustmentHe: 'לכלב חרדתי מתחילים מהמשך, והמרחק בא אחרון: הוא צריך לדעת שתחזרו. נשארים בטווח ראייה, וכלב שקם בבהלה מקבל הרגעה – לא החזרה בלחץ.',
  },
];
