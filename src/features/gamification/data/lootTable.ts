import type { IntelCard } from '../types';

// What loot boxes can drop. Rare drops are ethology facts with their source – every one is a published
// finding, worded conservatively – plus cosmetic profile frames. Nothing here can be bought.

export const INTEL_CARDS: readonly IntelCard[] = [
  { id: 'nose-receptors', titleHe: 'אף של על', factHe: 'לכלב יש עד כ־300 מיליון קולטני ריח, לעומת כ־6 מיליון אצל אדם. לכן הרחה בטיול היא עבודה מחשבתית אמיתית.', sourceHe: 'סקירות על מערכת הריח בכלבים' },
  { id: 'hearing-range', titleHe: 'שומע מה שאתם לא', factHe: 'כלבים שומעים צלילים עד בערך 45 קילוהרץ – הרבה מעל הגבול האנושי של כ־20 קילוהרץ.', sourceHe: 'Heffner, 1983' },
  { id: 'color-vision', titleHe: 'עולם בכחול וצהוב', factHe: 'לכלבים שני סוגי קולטני צבע: הם מבחינים היטב בכחול ובצהוב, ופחות באדום ובירוק. צעצוע כחול על דשא בולט להם יותר מאדום.', sourceHe: 'Neitz et al., 1989' },
  { id: 'social-window', titleHe: 'חלון החִברוּת', factHe: 'בין גיל 3 ל־12–14 שבועות גורים לומדים הכי מהר מה בטוח בעולם. חשיפה עדינה ונעימה בתקופה הזו מפחיתה פחדים בהמשך.', sourceHe: 'Scott & Fuller, 1965' },
  { id: 'chaser-words', titleHe: 'אוצר מילים של 1,022', factHe: 'בורדר קולי בשם צ׳ייסר למד לזהות בשמם 1,022 חפצים שונים, באימון יומיומי מבוסס תגמול.', sourceHe: 'Pilley & Reid, 2011' },
  { id: 'pointing', titleHe: 'הבנת הצבעה', factHe: 'כבר גורים צעירים מבינים הצבעה של אדם ומשתמשים בה כדי למצוא חטיף מוסתר – יכולת שאפילו שימפנזים מתקשים בה.', sourceHe: 'Hare et al., 2002' },
  { id: 'tail-asymmetry', titleHe: 'הזנב מספר', factHe: 'כלבים נוטים לכשכש יותר לצד ימין כשהם רואים את בעליהם, ויותר לשמאל מול כלב זר ומאיים.', sourceHe: 'Quaranta et al., 2007' },
  { id: 'stress-signals', titleHe: 'פיהוק הוא לא תמיד עייפות', factHe: 'פיהוק, ליקוק שפתיים ומבט צדדי שמראה את לבן העין יכולים להעיד על אי־נוחות. כשהם מופיעים באימון – מורידים קושי.', sourceHe: 'Mariti et al., 2017' },
  { id: 'play-bow', titleHe: 'קידת המשחק', factHe: 'קידת משחק – חזה למטה, ישבן למעלה – מסמנת "מה שבא אחרי זה הוא משחק", גם כשהמשחק נראה פרוע.', sourceHe: 'Bekoff, 1995' },
  { id: 'reward-welfare', titleHe: 'תגמול עדיף', factHe: 'כלבים שאולפו בשיטות אוורסיביות הראו יותר התנהגויות לחץ ומצב רגשי שלילי יותר מכלבים שאולפו בתגמול.', sourceHe: 'Vieira de Castro et al., 2020' },
];

export const AVATAR_FRAMES: readonly { id: string; nameHe: string }[] = [
  { id: 'frame-mint', nameHe: 'מסגרת מנטה זוהרת' },
  { id: 'frame-cyan', nameHe: 'מסגרת ציאן טקטית' },
  { id: 'frame-orange', nameHe: 'מסגרת להבה כתומה' },
  { id: 'frame-indigo', nameHe: 'מסגרת אינדיגו לילית' },
];

export const VIP_TITLES: readonly { id: string; nameHe: string }[] = [
  { id: 'title-k9-legend', nameHe: 'אגדת K9' },
  { id: 'title-silent-handler', nameHe: 'המדריך השקט' },
  { id: 'title-recall-ace', nameHe: 'אלוף הקריאה' },
];
