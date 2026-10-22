import { QUIET_STRUCTURE_PRINCIPLES_HE } from '../data/methodology';
import type { TemperamentInput, TrainingRecommendation } from '../types';

// Recommends a training track from what the owner observes. Aversive tools are never offered to
// anxious dogs or puppies; for adult high-arousal dogs the balanced track is suggested, with a trainer.

/** Puppies: no aversive tools before this age. */
export const MIN_MONTHS_FOR_TOOLS = 12;
/** Working breeds whose drive often reads as "stubbornness" – a note, not a verdict. */
const WORKING_BREEDS = new Set(['german-shepherd', 'belgian-malinois', 'border-collie', 'australian-shepherd', 'doberman', 'rottweiler']);

const R_PLUS_PRINCIPLES = [
  'מרקר מדויק ("כן!") ותגמול תוך שנייה.',
  'אימונים קצרים של 3–5 דקות, ומסיימים בהצלחה.',
  'מעלים קושי בהדרגה: קודם בבית, אחר כך בחוץ.',
];

/** The recommended track for a dog, with the reasons and working principles behind it. */
export function recommendTraining({ trait, ageMonths, breedId }: TemperamentInput): TrainingRecommendation {
  const isPuppy = ageMonths !== null && ageMonths < MIN_MONTHS_FOR_TOOLS;
  const breedNote = breedId && WORKING_BREEDS.has(breedId) ? ['גזע עבודה: הדחף הגבוה הוא מנוע – כשהוא מקבל תעסוקה מתאימה, הוא עובד בשבילכם.'] : [];

  if (trait === 'ANXIOUS_SENSITIVE') {
    return {
      track: 'FORCE_FREE',
      titleHe: 'חיזוק חיובי עם מבנה שקט',
      reasonsHe: ['בכלב חרדתי, לחץ וכאב מגבירים פחד ועלולים להוביל לתוקפנות מפחד.', 'מה שבונה ביטחון: הצלחות קטנות, צפיות וגבולות יציבים.', ...breedNote],
      principlesHe: [...QUIET_STRUCTURE_PRINCIPLES_HE],
      balancedAllowed: false,
      requiresProfessional: false,
    };
  }

  if (isPuppy) {
    return {
      track: 'FORCE_FREE',
      titleHe: 'חיזוק חיובי – בונים יסודות',
      reasonsHe: [`לפני גיל ${MIN_MONTHS_FOR_TOOLS} חודשים לא משתמשים בציוד אוורסיבי: הגוף והביטחון עוד מתפתחים.`, ...breedNote],
      principlesHe: trait === 'HIGH_AROUSAL_PREY' ? [...R_PLUS_PRINCIPLES, 'משחקי שליטה עצמית (התאפקות לפני משחק) מגיל צעיר.'] : R_PLUS_PRINCIPLES,
      balancedAllowed: false,
      requiresProfessional: false,
    };
  }

  if (trait === 'HIGH_AROUSAL_PREY') {
    return {
      track: 'BALANCED',
      titleHe: 'מסלול מאוזן, בליווי מאלף מקצועי',
      reasonsHe: [
        'בעוררות גבוהה הכלב לא תמיד "שומע" תגמול. אכיפה הוגנת עוזרת להבטיח ביצוע כשזה קריטי – קריאה ליד כביש, עצירה מול חתול.',
        'הבסיס נשאר חיזוק חיובי: כל פקודה נלמדת קודם בתגמול.',
        'שימו לב: איגודי ההתנהגות הווטרינריים ממליצים לנסות קודם ניהול סביבה ועבודה על סף העוררות – והמסלול מתאים רק לכלב לא חרדתי.',
        ...breedNote,
      ],
      principlesHe: ['עבודה מתחת לסף: מתרגלים במרחק שבו הכלב עוד מסוגל להגיב.', 'לחץ קטן שמשתחרר ברגע הביצוע – לא עונש.', 'יציאה לפעילות פיזית ומחשבתית לפני האימון, כדי להוריד עוררות.'],
      balancedAllowed: true,
      requiresProfessional: true,
    };
  }

  return {
    track: 'FORCE_FREE',
    titleHe: 'חיזוק חיובי',
    reasonsHe: ['כלב יציב לומד מהר ובהנאה עם מרקר ותגמול – זה המסלול המומלץ כברירת מחדל.', ...breedNote],
    principlesHe: R_PLUS_PRINCIPLES,
    balancedAllowed: true,
    requiresProfessional: false,
  };
}
