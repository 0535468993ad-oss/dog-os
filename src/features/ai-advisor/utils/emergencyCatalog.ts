// Fixed emergency content for the chat guardrail. Toxic foods reuse the kitchen's reviewed blacklist, so
// the danger text is identical everywhere in the app. Nothing here depends on the network or on AI.
import { TOXIC_FOODS } from '@/features/kitchen/utils/catalog';

import type { EmergencyKind } from '../types';

/** The toxins the chat intercepts: chocolate, grapes, the onion family and xylitol. */
const CHAT_TOXIN_IDS = new Set(['chocolate', 'cocoa', 'grapes', 'raisins', 'onion', 'garlic', 'chives', 'leek', 'xylitol']);

/** Kitchen aliases too broad for free text ("gums" are part of the dog; "sugar free" is a label, not an event). */
const CHAT_EXCLUDED_ALIASES = new Set(['ללא סוכר', 'sugar free', 'gum']);

export interface ChatToxin {
  nameHe: string;
  dangerHe: string;
  aliases: readonly string[];
}

export const CHAT_TOXINS: readonly ChatToxin[] = TOXIC_FOODS.filter((food) => CHAT_TOXIN_IDS.has(food.id)).map((food) => ({
  nameHe: food.nameHe,
  dangerHe: food.dangerDetailsHe ?? food.preparationRulesHe,
  aliases: food.aliases.filter((alias) => !CHAT_EXCLUDED_ALIASES.has(alias)),
}));

export const SNAKEBITE_ALIASES = ['נחש', 'צפע', 'הכשה', 'הכיש', 'הוכש', 'snake', 'viper'];

export const BLOAT_ALIASES = ['היפוך קיבה', 'הפיכת קיבה', 'קיבה מתהפכת', 'פיתול קיבה', 'בטן נפוחה', 'בטן תפוחה', 'gdv', 'bloat'];

/** Who to call – shown under every alert. No phone numbers: they change, and a wrong one costs minutes. */
export const EMERGENCY_CONTACTS_HE: readonly string[] = [
  'הווטרינר הקבוע שלכם – גם מחוץ לשעות הפעילות, רבים משאירים מספר חירום בהודעה המוקלטת.',
  'מרפאת החירום הקרובה שפתוחה 24/7, למשל בית החולים הווטרינרי האוניברסיטאי בבית דגן.',
];

interface EmergencyCopy {
  titleHe: string;
  whyHe: string;
  actionsHe: readonly string[];
  avoidHe: readonly string[];
}

export const TOXIN_ACTIONS_HE: Pick<EmergencyCopy, 'actionsHe' | 'avoidHe'> = {
  actionsHe: [
    'התקשרו עכשיו לווטרינר או למרפאת חירום – גם אם הכלב נראה בסדר. תסמינים מופיעים לפעמים רק אחרי כמה שעות.',
    'ספרו מה הכלב אכל, כמה, מתי, ומה המשקל שלו.',
    'שמרו את האריזה או את מה שנשאר – זה עוזר לחשב את המינון.',
  ],
  avoidHe: ['אל תגרמו להקאה בלי הנחיה של וטרינר – לפעמים זה מזיק יותר.'],
};

export const EMERGENCY_COPY: Record<Exclude<EmergencyKind, 'TOXIN'>, EmergencyCopy> = {
  SNAKEBITE: {
    titleHe: 'הכשת נחש',
    whyHe: 'ארס של צפע ארץ־ישראלי פוגע בקרישת הדם ובכלי הדם. ככל שהטיפול מתחיל מוקדם יותר, הסיכוי טוב יותר.',
    actionsHe: [
      'שמרו על הכלב רגוע וכמה שפחות בתנועה. אם אפשר, שאו אותו על הידיים.',
      'סעו לווטרינר עכשיו, והתקשרו בדרך כדי שיכינו נסיוב נגד ארס.',
      'אם ראיתם את הנחש, זכרו איך הוא נראה. אל תנסו לתפוס אותו.',
    ],
    avoidHe: ['לא חותכים, לא מוצצים, לא קושרים חוסם עורקים ולא שמים קרח.'],
  },
  BLOAT: {
    titleHe: 'חשד להיפוך קיבה',
    whyHe: 'היפוך קיבה מסכן חיים ודורש ניתוח דחוף. כל שעה משנה.',
    actionsHe: [
      'סעו עכשיו למרפאת חירום. התקשרו בדרך כדי שיתכוננו.',
      'הסימנים: בטן נפוחה וקשה, ניסיונות להקיא בלי שיוצא כלום, ריור, אי־שקט וחולשה.',
    ],
    avoidHe: ['לא נותנים אוכל או מים, ולא מחכים לראות אם זה עובר.'],
  },
};
