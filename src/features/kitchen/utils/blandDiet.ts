import type { BlandRole } from '../types';

// Which safe foods may go into the bland diet, in which role, and how energy-dense they are once
// cooked (kcal per gram, USDA FoodData Central values for the plain cooked food).

export interface BlandProfile {
  role: BlandRole;
  kcalPerGram: number;
  /** The preparation step shown in the recipe, in the recipe's voice. */
  stepHe: string;
}

/** Ordered by preference within each role: the first one in the pantry is used. */
export const BLAND_PROFILES: Readonly<Record<string, BlandProfile>> = {
  'white-rice': {
    role: 'carb',
    kcalPerGram: 1.3,
    stepHe: 'מבשלים אורז לבן בהרבה מים, עד שהוא רך מאוד – אפילו קצת יותר רך ממה שאתם רגילים. בלי מלח ובלי שמן.',
  },
  potato: {
    role: 'carb',
    kcalPerGram: 0.87,
    stepHe: 'מקלפים את תפוח האדמה, חותכים לקוביות ומבשלים במים עד שהוא מתפרק במזלג. בלי מלח, בלי חמאה.',
  },
  'sweet-potato': {
    role: 'carb',
    kcalPerGram: 0.76,
    stepHe: 'מקלפים את הבטטה ומבשלים במים עד שהיא רכה לגמרי, ואז מועכים אותה.',
  },
  'chicken-breast': {
    role: 'protein',
    kcalPerGram: 1.51,
    stepHe: 'מבשלים את חזה העוף בסיר עם מים בלבד – בלי מלח, שמן או תבלינים – עד שהוא לבן לגמרי גם מבפנים. מורידים עור, מוודאים שלא נשארה אף עצם, ומפוררים לחתיכות קטנות.',
  },
  'turkey-breast': {
    role: 'protein',
    kcalPerGram: 1.35,
    stepHe: 'מבשלים את חזה ההודו במים בלבד עד שהוא מבושל לגמרי, מורידים עור ועצמות ומפוררים לחתיכות קטנות.',
  },
  cottage: {
    role: 'protein',
    kcalPerGram: 0.72,
    stepHe: 'את הקוטג׳ לא צריך לבשל – פשוט מוסיפים אותו כמו שהוא, אחרי שהשאר התקרר.',
  },
  egg: {
    role: 'protein',
    kcalPerGram: 1.48,
    stepHe: 'מקשקשים את הביצה במחבת נקייה בלי שמן ובלי מלח, או מבשלים אותה עד שהיא קשה, ומפוררים. ביצה בינונית שוקלת בערך 50 גרם.',
  },
  pumpkin: {
    role: 'fiber',
    kcalPerGram: 0.2,
    stepHe: 'מאדים או מבשלים את הדלעת עד שהיא רכה, ומועכים. היא עוזרת לצואה להתייצב.',
  },
  carrot: {
    role: 'fiber',
    kcalPerGram: 0.35,
    stepHe: 'מבשלים את הגזר עד שהוא רך, וחותכים לחתיכות קטנות מאוד או מועכים.',
  },
};

/** Share of the meal's weight per role: 2:1 carb to protein, plus a small fiber addition when available. */
export const FIBER_SHARE = 0.1;
export const CARB_TO_PROTEIN = 2;

/** Small, frequent meals are easier on an upset stomach. */
export const BLAND_MEALS_PER_DAY = 4;

/** Body weights the portion formula is meant for (kg). */
export const WEIGHT_RANGE_KG = { min: 1, max: 90 } as const;

/** Resting energy requirement, kcal/day: RER = 70 × kg^0.75 (the bland diet feeds rest, not activity). */
export function restingEnergyKcal(weightKg: number): number {
  return 70 * weightKg ** 0.75;
}
