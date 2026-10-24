import type { GearItem, TrainingCommand } from '../../types';
import { GENERALIZATION_RULE_HE } from '../methodology';

// Commands 5, 8 and 9: place, heel, hand target – calm boundaries, loose-leash walking, and a reset
// signal. Pure reward-based training, marker at the exact instant, reward within 1–2 seconds.

const POUCH: GearItem = { nameHe: 'פאוץ׳ חטיפים על החגורה' };
const MARKER: GearItem = { nameHe: 'קליקר או מילת מרקר ("כן!")' };

export const ENGAGEMENT_COMMANDS: readonly TrainingCommand[] = [
  {
    id: 'place',
    order: 5,
    nameHe: 'למקום',
    nameEn: 'Place / Bed',
    cueHe: 'למקום',
    category: 'IMPULSE_CONTROL',
    difficulty: 'INTERMEDIATE',
    xpReward: 100,
    targetGoal: 'הכלב עולה על המיטה ונשאר בה רגוע עד שחרור – לאורחים, לארוחות ולדפיקה בדלת.',
    prerequisites: ['down'],
    gear: [{ nameHe: 'מיטה מוגבהת (Cot)', noteHe: 'גבול פיזי ברור: הכלב יודע בדיוק מתי הוא "על המקום"' }, POUCH, MARKER],
    steps: [
      { stepIndex: 1, titleHe: 'עלייה', instructionHe: 'זורקים חטיף על המיטה; הכלב עולה.', markerCue: 'ברגע שארבע הכפות על המיטה', durationSec: 60 },
      { stepIndex: 2, titleHe: 'בחירה', instructionHe: 'מחכים שיעלה בעצמו, ומוסיפים "למקום" רגע לפני שהוא עולה.', markerCue: 'ברגע העלייה אחרי המילה', durationSec: 60 },
      { stepIndex: 3, titleHe: 'שכיבה', instructionHe: 'מתגמלים בשכיבה על המיטה – חטיפים במרווחים הולכים וגדלים.', markerCue: 'כשהכלב שוכב רגוע על המיטה', durationSec: 120 },
      { stepIndex: 4, titleHe: 'משך והסחות', instructionHe: 'מוסיפים משך והסחות כמו ב"הישאר", ומשחררים במילה קבועה.', markerCue: 'כשהכלב נשאר למרות ההסחה', durationSec: 180 },
    ],
    commonMistakes: ['לשלוח למיטה בכעס – המיטה היא מקום טוב, לא עונש.', 'להשאיר את הכלב על המיטה שעות.', 'לשכוח לשחרר – הכלב לומד לשחרר את עצמו.'],
    environmentalGeneralization: `לוקחים את המיטה למרפסת, לבית קפה ולביקור אצל חברים. ${GENERALIZATION_RULE_HE}`,
    anxiousDogAdjustmentHe: 'המיטה יכולה להפוך למקום הבטוח שלו: מניחים אותה בפינה שקטה עם גב לקיר, ולעולם לא שולחים אליה כעונש.',
  },
  {
    id: 'heel',
    order: 8,
    nameHe: 'רגלי',
    nameEn: 'Heel / Focus Walking',
    cueHe: 'רגלי',
    category: 'FOUNDATION_OBEDIENCE',
    difficulty: 'ADVANCED',
    xpReward: 100,
    targetGoal: 'הכלב הולך צמוד לרגל, כתף ליד הברך, עם רצועה רפויה – גם ברחוב עמוס.',
    prerequisites: ['sit', 'touch'],
    gear: [
      { nameHe: 'רצועה קבועה 1.5 מ׳', noteHe: 'רצועה נשלפת (פלקסי) אסורה: היא מתגמלת משיכה ומלמדת את ההפך' },
      POUCH,
      MARKER,
    ],
    steps: [
      { stepIndex: 1, titleHe: 'הנקודה', instructionHe: 'עומדים, ומתגמלים כל פעם שהכלב ליד הרגל השמאלית – החטיף בגובה הברך.', markerCue: 'ברגע שהכתף ליד הברך', durationSec: 60 },
      { stepIndex: 2, titleHe: 'צעד', instructionHe: 'צעד אחד – תגמול ליד הרגל. שניים, שלושה, ומאריכים.', markerCue: 'בכל צעד שהכלב צמוד', durationSec: 120 },
      { stepIndex: 3, titleHe: 'עצירה כמו עץ', instructionHe: 'הכלב מושך? עוצרים ועומדים. ממשיכים רק כשהרצועה רפויה – בלי למשוך אותו חזרה.', markerCue: 'ברגע שהרצועה מתרפה', durationSec: 120 },
      { stepIndex: 4, titleHe: 'פניות וקצב', instructionHe: 'מוסיפים פניות ושינויי קצב, ומתגמלים הישארות ליד הרגל בכל פנייה.', markerCue: 'ביציאה מהפנייה כשהכלב צמוד', durationSec: 180 },
    ],
    commonMistakes: ['רצועה נשלפת – הכלב לומד שמשיכה מאריכה את הטיול.', 'למשוך את הכלב חזרה – העצירה עצמה היא המידע.', 'לבקש "רגלי" לטיול שלם – מתחילים ב־30 שניות ומאריכים.'],
    environmentalGeneralization: `מתרגלים ברחוב שקט, אחר כך במדרכה עם אנשים ועגלות. ${GENERALIZATION_RULE_HE}`,
    anxiousDogAdjustmentHe: 'לכלב חרדתי מתחילים ברחוב הכי שקט, בשעות רגועות, והוא הולך בצד הרחוק מהכביש. קפא? עוצרים, נותנים לו להסתכל, ולא מושכים.',
  },
  {
    id: 'touch',
    order: 9,
    nameHe: 'גע / טאץ׳',
    nameEn: 'Hand Target',
    cueHe: 'גע',
    category: 'ENGAGEMENT_TARGETING',
    difficulty: 'BEGINNER',
    xpReward: 100,
    targetGoal: 'הכלב נוגע באף בכף היד הפתוחה – עוגן לתשומת לב, להכוונה ולאיפוס ברחוב.',
    prerequisites: [],
    gear: [POUCH, MARKER],
    steps: [
      { stepIndex: 1, titleHe: 'יד מוגשת', instructionHe: 'כף יד פתוחה כמה סנטימטרים מהאף. התגמול מהיד השנייה.', markerCue: 'ברגע שהאף נוגע בכף היד', durationSec: 60 },
      { stepIndex: 2, titleHe: 'מעקב', instructionHe: 'מזיזים את היד לצדדים, למעלה ולמטה – הכלב עוקב כדי לגעת.', markerCue: 'ברגע הנגיעה', durationSec: 60 },
      { stepIndex: 3, titleHe: 'מילה ומרחק', instructionHe: 'אומרים "גע" רגע לפני שמגישים את היד, ומרחיקים אותה בהדרגה.', markerCue: 'ברגע הנגיעה אחרי המילה', durationSec: 60 },
      { stepIndex: 4, titleHe: 'איפוס', instructionHe: 'משתמשים ב"גע" כדי להסיט מבט מכלב אחר או להוביל ליד הרגל.', markerCue: 'ברגע שהכלב פונה מהגירוי ונוגע', durationSec: 120 },
    ],
    commonMistakes: ['לדחוף את היד אל האף – הכלב צריך לבוא אליה.', 'לתגמל נגיעה בפה במקום באף.', 'להשתמש ב"גע" רק כשיש בעיה – מתרגלים גם ברגעים רגועים.'],
    environmentalGeneralization: `מתרגלים ליד גירויים במרחק בטוח – כלב אחר מעבר לכביש, אופניים חולפים. ${GENERALIZATION_RULE_HE}`,
    anxiousDogAdjustmentHe: '"גע" הוא כלי מצוין לכלב חרדתי: משימה ברורה ברגע מלחיץ. מלמדים בבית עד שהוא בטוח, ובחוץ משתמשים בו כדי להרחיק אותו מהגירוי.',
  },
];
