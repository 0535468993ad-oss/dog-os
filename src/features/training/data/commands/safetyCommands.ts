import type { GearItem, TrainingCommand } from '../../types';
import { GENERALIZATION_RULE_HE } from '../methodology';

// Commands 4, 6 and 7: recall, leave it, drop it – the commands that save lives (traffic, toxins,
// swallowed objects). Pure reward-based training, marker at the exact instant, reward within 1–2 s.

const POUCH: GearItem = { nameHe: 'פאוץ׳ חטיפים על החגורה', noteHe: 'חטיפים בעלי ערך גבוה במיוחד' };
const MARKER: GearItem = { nameHe: 'קליקר או מילת מרקר ("כן!")' };

export const SAFETY_COMMANDS: readonly TrainingCommand[] = [
  {
    id: 'recall',
    order: 4,
    nameHe: 'אליי',
    nameEn: 'Recall',
    cueHe: 'אליי',
    category: 'LIFE_SAVING_SAFETY',
    difficulty: 'INTERMEDIATE',
    xpReward: 100,
    targetGoal: 'הכלב עוזב הכול ורץ אליכם בפעם הראשונה שקוראים – הפקודה שמצילה חיים.',
    prerequisites: [],
    gear: [
      { nameHe: 'רצועת ביותן ארוכה 10–15 מ׳', noteHe: 'מחוברת לרתמה, לא לקולר – למניעת פגיעה בצוואר' },
      POUCH,
      { nameHe: 'משרוקית אילוף', noteHe: 'צליל קבוע שנשמע למרחק ולא משתנה עם מצב הרוח' },
    ],
    steps: [
      { stepIndex: 1, titleHe: 'מילה ששווה זהב', instructionHe: 'בבית, כשהכלב כבר בדרך אליכם, אומרים "אליי" ונותנים ג׳קפוט: כמה חטיפים ברצף ומשחק.', markerCue: 'ברגע שהכלב מגיע אליכם', durationSec: 60 },
      { stepIndex: 2, titleHe: 'פינג־פונג', instructionHe: 'שני אנשים בקצוות החדר קוראים לסירוגין, וכל הגעה מתוגמלת.', markerCue: 'ברגע ההגעה', durationSec: 120 },
      { stepIndex: 3, titleHe: 'תפיסה עדינה', instructionHe: 'קוראים, אוחזים בעדינות ברתמה – ורק אז החטיף. כך הגעה לא נגמרת ב"תפסו אותי".', markerCue: 'אחרי האחיזה ברתמה', durationSec: 60 },
      { stepIndex: 4, titleHe: 'רצועה ארוכה', instructionHe: 'בחצר או בשטח סגור, על הרצועה הארוכה: קוראים ברגעי הסחה קטנה, ומתגמלים בגדול.', markerCue: 'ברגע שהכלב מסתובב אליכם', durationSec: 180 },
    ],
    commonMistakes: ['לקרוא "אליי" לפני דבר לא נעים: מקלחת, ציפורניים, סוף הטיול.', 'לכעוס על כלב שהגיע באיחור – הוא לומד שלהגיע זה מסוכן.', 'לקרוא כשאין סיכוי שיבוא – כל קריאה שנכשלת מחלישה את המילה.'],
    environmentalGeneralization: `עוברים לגינה שקטה, אחר כך לפארק – תמיד על הרצועה הארוכה עד הצלחה עקבית. ${GENERALIZATION_RULE_HE}`,
    anxiousDogAdjustmentHe: 'לא קוראים לכלב חרדתי כדי לסיים משהו נעים או לפני משהו מפחיד (אמבטיה, וטרינר). מתכופפים בצד ולא מולו, ומתגמלים בנדיבות כל הגעה – גם איטית.',
  },
  {
    id: 'leave-it',
    order: 6,
    nameHe: 'לא לגעת',
    nameEn: 'Leave It',
    cueHe: 'לא לגעת',
    category: 'LIFE_SAVING_SAFETY',
    difficulty: 'INTERMEDIATE',
    xpReward: 100,
    targetGoal: 'הכלב מוותר על מה שמושך אותו – אוכל ברחוב, רעל, חפץ מסוכן – ומסתכל עליכם.',
    prerequisites: ['sit'],
    gear: [{ nameHe: 'צלוחית שקופה', noteHe: 'הכלב רואה את החטיף אבל לא מגיע אליו' }, { nameHe: 'חטיפים בשתי רמות ערך' }, MARKER],
    steps: [
      { stepIndex: 1, titleHe: 'מתחת לצלוחית', instructionHe: 'חטיף רגיל מתחת לצלוחית השקופה. הכלב מרחרח ומנסה – מחכים בשקט.', markerCue: 'ברגע שהכלב מתרחק או מסתכל עליכם', durationSec: 60 },
      { stepIndex: 2, titleHe: 'תגמול גבוה יותר', instructionHe: 'התגמול מגיע מהיד השנייה ושווה יותר – לעולם לא החטיף שעל הרצפה.', markerCue: 'ברגע הוויתור', durationSec: 60 },
      { stepIndex: 3, titleHe: 'מילה', instructionHe: 'אומרים "לא לגעת" לפני שמניחים את הצלוחית, ובהדרגה מורידים אותה.', markerCue: 'ברגע הוויתור אחרי המילה', durationSec: 90 },
      { stepIndex: 4, titleHe: 'בהליכה', instructionHe: 'על רצועה, ליד חטיף על הרצפה – מתגמלים כל פנייה אליכם.', markerCue: 'ברגע שהראש פונה אליכם', durationSec: 120 },
    ],
    commonMistakes: ['לתת לכלב את החטיף שעל הרצפה בסוף – זה מלמד שוויתור הוא רק המתנה.', 'להתחיל עם פיתוי חזק מדי (שניצל, עצם).', 'לתקן כלב ששומר על משאב – זה מסלים; פונים לאנשי מקצוע.'],
    environmentalGeneralization: `מתרגלים ליד פחים, בגינה ובשוק – עם פריטים שמניחים מראש, בשליטה. ${GENERALIZATION_RULE_HE}`,
    anxiousDogAdjustmentHe: 'לכלב חרדתי לא אומרים "לא" חד ולא מכים ביד על הפריט – מכסים אותו בשקט ומחכים. הגבול הוא היד שנסגרת, לא הקול.',
  },
  {
    id: 'drop-it',
    order: 7,
    nameHe: 'עזוב / שחרר',
    nameEn: 'Drop It',
    cueHe: 'עזוב',
    category: 'LIFE_SAVING_SAFETY',
    difficulty: 'INTERMEDIATE',
    xpReward: 100,
    targetGoal: 'הכלב משחרר מהפה צעצוע, גרב או עצם – ומקבל משהו טוב בתמורה.',
    prerequisites: [],
    gear: [{ nameHe: 'שני צעצועים זהים', noteHe: 'החלפה שווה: מה שבפה לא שווה יותר ממה שביד' }, POUCH, MARKER],
    steps: [
      { stepIndex: 1, titleHe: 'משחק החלפה', instructionHe: 'משחקים עם צעצוע אחד, ומניעים את הצעצוע הזהה ביד.', markerCue: 'ברגע שהצעצוע נופל מהפה', durationSec: 90 },
      { stepIndex: 2, titleHe: 'מילה', instructionHe: 'אומרים "עזוב" רגע לפני שמציגים את הצעצוע השני.', markerCue: 'ברגע השחרור אחרי המילה', durationSec: 60 },
      { stepIndex: 3, titleHe: 'החלפה בחטיף', instructionHe: '"עזוב", הכלב משחרר, חטיף – ולרוב מחזירים לו את הצעצוע.', markerCue: 'ברגע השחרור', durationSec: 60 },
      { stepIndex: 4, titleHe: 'חפצים אחרים', instructionHe: 'מתרגלים עם חפצים שמותר להחזיק, לפני שמגיעים לגרביים ולדברים אסורים.', markerCue: 'ברגע השחרור', durationSec: 90 },
    ],
    commonMistakes: ['לרדוף אחרי כלב עם חפץ – זה הופך למשחק תפסת.', 'לפתוח לסת בכוח – הדרך המהירה לנשיכה.', 'לקחת תמיד את הצעצוע לתמיד – הכלב לומד לא לשחרר.'],
    environmentalGeneralization: `מתרגלים בחוץ עם מקלות ואצטרובלים – תמיד עם החלפה שווה. ${GENERALIZATION_RULE_HE}`,
    anxiousDogAdjustmentHe: 'לא רודפים אחרי כלב חרדתי שתפס חפץ ולא רוכנים מעליו – זה מלמד לברוח או לשמור. מתרחקים מעט ומציעים החלפה שווה מהצד.',
  },
];
