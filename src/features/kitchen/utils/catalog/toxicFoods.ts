import type { IngredientDefinition } from '../../types';

// Zero-tolerance blacklist, from the standard veterinary toxicology references (ASPCA Animal Poison
// Control, Merck Veterinary Manual). Fixed in code: nothing here depends on the network or on AI.

const NEVER = 'אסור לתת בשום צורה – לא נא, לא מבושל ולא כחלק ממאכל אחר.';

const ALLIUM_DANGER =
  'ממשפחת הבצל. פוגע בתאי הדם האדומים וגורם לאנמיה – גם מבושל, מטוגן או כאבקה בתוך אוכל אחר. הנזק מצטבר, כך שגם כמויות קטנות לאורך כמה ימים מסוכנות.';
const METHYLXANTHINE_DANGER =
  'מכיל תאוברומין או קפאין, שהכלב מפרק לאט מאוד. זה גורם להקאות, לדופק מהיר, לרעד ובמקרים קשים לפרכוסים.';
const GRAPE_DANGER = 'עלול לגרום לאי־ספיקת כליות חדה, ואין כמות שידוע שהיא בטוחה. יש כלבים שנפגעים גם מכמה בודדים.';

export const TOXIC_FOODS: readonly IngredientDefinition[] = [
  { id: 'onion', nameHe: 'בצל', tier: 'TOXIC', category: 'VEGGIE', aliases: ['בצל', 'בצל ירוק', 'שאלוט', 'onion', 'scallion', 'shallot'], preparationRulesHe: NEVER, dangerDetailsHe: ALLIUM_DANGER },
  { id: 'garlic', nameHe: 'שום', tier: 'TOXIC', category: 'VEGGIE', aliases: ['שום', 'garlic'], preparationRulesHe: NEVER, dangerDetailsHe: ALLIUM_DANGER },
  { id: 'chives', nameHe: 'עירית', tier: 'TOXIC', category: 'VEGGIE', aliases: ['עירית', 'chive'], preparationRulesHe: NEVER, dangerDetailsHe: ALLIUM_DANGER },
  { id: 'leek', nameHe: 'כרישה', tier: 'TOXIC', category: 'VEGGIE', aliases: ['כרישה', 'leek'], preparationRulesHe: NEVER, dangerDetailsHe: ALLIUM_DANGER },
  {
    id: 'chocolate',
    nameHe: 'שוקולד',
    tier: 'TOXIC',
    category: 'OTHER',
    aliases: ['שוקולד', 'נוטלה', 'chocolate'],
    preparationRulesHe: NEVER,
    dangerDetailsHe: `${METHYLXANTHINE_DANGER} שוקולד מריר הכי מסוכן.`,
  },
  { id: 'cocoa', nameHe: 'קקאו', tier: 'TOXIC', category: 'OTHER', aliases: ['קקאו', 'שוקו', 'cocoa'], preparationRulesHe: NEVER, dangerDetailsHe: `${METHYLXANTHINE_DANGER} אבקת קקאו מרוכזת במיוחד.` },
  { id: 'coffee', nameHe: 'קפה', tier: 'TOXIC', category: 'OTHER', aliases: ['קפה', 'אספרסו', 'קפאין', 'coffee', 'espresso', 'caffeine'], preparationRulesHe: NEVER, dangerDetailsHe: METHYLXANTHINE_DANGER },
  { id: 'tea', nameHe: 'תה', tier: 'TOXIC', category: 'OTHER', aliases: ['תה', 'tea'], preparationRulesHe: NEVER, dangerDetailsHe: METHYLXANTHINE_DANGER },
  { id: 'grapes', nameHe: 'ענבים', tier: 'TOXIC', category: 'VEGGIE', aliases: ['ענב', 'grape'], preparationRulesHe: NEVER, dangerDetailsHe: GRAPE_DANGER },
  { id: 'raisins', nameHe: 'צימוקים', tier: 'TOXIC', category: 'VEGGIE', aliases: ['צימוק', 'raisin', 'sultana'], preparationRulesHe: NEVER, dangerDetailsHe: GRAPE_DANGER },
  {
    id: 'xylitol',
    nameHe: 'קסיליטול (ממתיק)',
    tier: 'TOXIC',
    category: 'OTHER',
    aliases: ['קסיליטול', 'סוכר ליבנה', 'ממתיק', 'מסטיק', 'ללא סוכר', 'xylitol', 'birch sugar', 'sweetener', 'gum', 'sugar free'],
    preparationRulesHe: NEVER,
    dangerDetailsHe:
      'גורם לשחרור מהיר של אינסולין ולירידה חדה של הסוכר בדם תוך דקות, ובכמות גדולה גם לנזק לכבד. נמצא במסטיקים, בממתקים ובחמאות בוטנים "ללא סוכר" – תמיד בודקים את התווית.',
  },
  {
    id: 'avocado',
    nameHe: 'אבוקדו',
    tier: 'TOXIC',
    category: 'FAT_SUPPLEMENT',
    aliases: ['אבוקדו', 'גוואקמולי', 'avocado', 'guacamole'],
    preparationRulesHe: NEVER,
    dangerDetailsHe: 'יש בו פרסין – בפרי, בקליפה ובגלעין – והגלעין הגדול עלול גם להיתקע במעיים. גוואקמולי מסוכן כפליים, כי יש בו בצל ושום.',
  },
  {
    id: 'cooked-bones',
    nameHe: 'עצמות מבושלות',
    tier: 'TOXIC',
    category: 'PROTEIN',
    aliases: ['עצם', 'bone'],
    preparationRulesHe: 'אסור לתת עצמות מבושלות מכל סוג – עוף, בקר או דג.',
    dangerDetailsHe: 'עצם מבושלת נשברת לשברים חדים שעלולים לנקב את הוושט, הקיבה או המעיים, או לגרום לחסימה.',
  },
  {
    id: 'macadamia',
    nameHe: 'אגוזי מקדמיה',
    tier: 'TOXIC',
    category: 'FAT_SUPPLEMENT',
    aliases: ['מקדמיה', 'macadamia'],
    preparationRulesHe: NEVER,
    dangerDetailsHe: 'גורמים לחולשה ברגליים האחוריות, לרעד ולחום גבוה. בדרך כלל זה חולף, אבל צריך בדיקה.',
  },
  {
    id: 'yeast-dough',
    nameHe: 'בצק שמרים',
    tier: 'TOXIC',
    category: 'CARB',
    aliases: ['בצק', 'שמרים', 'yeast', 'dough'],
    preparationRulesHe: NEVER,
    dangerDetailsHe: 'בצק לא אפוי ממשיך לתפוח בקיבה החמה, גורם לנפיחות כואבת ומייצר אלכוהול שנספג בדם.',
  },
  {
    id: 'alcohol',
    nameHe: 'אלכוהול',
    tier: 'TOXIC',
    category: 'OTHER',
    aliases: ['אלכוהול', 'יין', 'בירה', 'וודקה', 'ערק', 'וויסקי', 'ליקר', 'alcohol', 'wine', 'beer', 'vodka', 'whisky', 'liqueur'],
    preparationRulesHe: NEVER,
    dangerDetailsHe: 'גם כמות קטנה גורמת אצל כלב להקאות, לבלבול, לירידה בחום הגוף ובסוכר, ובמקרים קשים לקשיי נשימה.',
  },
  {
    id: 'nutmeg',
    nameHe: 'אגוז מוסקט',
    tier: 'TOXIC',
    category: 'OTHER',
    aliases: ['מוסקט', 'nutmeg'],
    preparationRulesHe: NEVER,
    dangerDetailsHe: 'מכיל מיריסטיצין, שגורם לבלבול, לדופק מהיר, לרעד ולכאבי בטן.',
  },
];
