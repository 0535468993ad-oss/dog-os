import type { IngredientDefinition } from '../../types';

// Plain foods that are safe when prepared as described – the building blocks of the bland diet.
export const SAFE_FOODS: readonly IngredientDefinition[] = [
  { id: 'white-rice', nameHe: 'אורז לבן', tier: 'SAFE', category: 'CARB', aliases: ['אורז', 'rice'], preparationRulesHe: 'מבושל במים בלבד עד שהוא רך מאוד, בלי מלח ובלי שמן.' },
  { id: 'potato', nameHe: 'תפוח אדמה', tier: 'SAFE', category: 'CARB', aliases: ['תפוח אדמה', 'תפוא', 'potato'], preparationRulesHe: 'מקולף ומבושל היטב במים. אף פעם לא נא, ולא חלקים ירוקים.' },
  { id: 'sweet-potato', nameHe: 'בטטה', tier: 'SAFE', category: 'CARB', aliases: ['בטטה', 'sweet potato'], preparationRulesHe: 'מקולפת ומבושלת או אפויה עד שהיא רכה, בלי תוספות.' },
  { id: 'oats', nameHe: 'שיבולת שועל', tier: 'SAFE', category: 'CARB', aliases: ['שיבולת שועל', 'קוואקר', 'oats', 'oatmeal'], preparationRulesHe: 'מבושלת במים, בלי סוכר ובלי חלב.' },
  { id: 'chicken-breast', nameHe: 'חזה עוף', tier: 'SAFE', category: 'PROTEIN', aliases: ['עוף', 'חזה עוף', 'chicken'], preparationRulesHe: 'רק מבושל במים, ללא עצמות, ללא עור, ללא שמן וללא תבלינים.' },
  { id: 'turkey-breast', nameHe: 'חזה הודו', tier: 'SAFE', category: 'PROTEIN', aliases: ['הודו', 'חזה הודו', 'turkey'], preparationRulesHe: 'רק מבושל במים, ללא עצמות, ללא עור וללא תבלינים.' },
  { id: 'cottage', nameHe: 'קוטג׳ דל שומן', tier: 'SAFE', category: 'PROTEIN', aliases: ['קוטג', 'גבינת קוטג', 'cottage'], preparationRulesHe: 'קוטג׳ 1%–3% כמו שהוא, בלי תוספות.' },
  { id: 'egg', nameHe: 'ביצה', tier: 'SAFE', category: 'PROTEIN', aliases: ['ביצה', 'ביצים', 'egg'], preparationRulesHe: 'מבושלת עד הסוף – קשה, או מקושקשת בלי שמן ובלי מלח.' },
  { id: 'pumpkin', nameHe: 'דלעת', tier: 'SAFE', category: 'VEGGIE', aliases: ['דלעת', 'דלורית', 'pumpkin', 'squash'], preparationRulesHe: 'מאודה או מבושלת ומעוכה, בלי תבלינים.' },
  { id: 'carrot', nameHe: 'גזר', tier: 'SAFE', category: 'VEGGIE', aliases: ['גזר', 'carrot'], preparationRulesHe: 'מבושל או מאודה עד שהוא רך, חתוך לחתיכות קטנות.' },
  { id: 'zucchini', nameHe: 'קישוא', tier: 'SAFE', category: 'VEGGIE', aliases: ['קישוא', 'zucchini'], preparationRulesHe: 'מבושל או מאודה, בלי שמן ובלי מלח.' },
  { id: 'green-beans', nameHe: 'שעועית ירוקה', tier: 'SAFE', category: 'VEGGIE', aliases: ['שעועית ירוקה', 'green bean'], preparationRulesHe: 'מבושלת, בלי מלח – לא מקופסה עם מלח.' },
];
