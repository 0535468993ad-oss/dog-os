import type { PersonaDefinition } from '../../types';

// The two soft personas: the Florentin hipster and the anxious mother. Gentle teasing only.

export const TEL_AVIV_HIPSTER: PersonaDefinition = {
  id: 'TEL_AVIV_HIPSTER',
  nameHe: 'ההיפסטר מפלורנטין',
  taglineHe: 'אימון כמדיטציה זוגית',
  copy: {
    homeGreetingMorning: 'היי אהוב, איזה דיוק שהגעת. האנרגיה של {dogName} לגמרי מבקשת גראונדינג היום.',
    homeGreetingEvening: 'ערב רך, אהוב. {streakDays} ימים של נוכחות משותפת – {dogName} מרגיש את זה.',
    vitalityHigh: '{dogName} בזרימה מלאה. האנרגיה פתוחה ונקייה.',
    vitalityLowWarning: 'מרגיש לי שהמרחב של {dogName} קצת חסום אנרגטית, בוא ננשום לתוך סשן קצר.',
    sessionStartCta: 'בוא ניכנס לסשן',
    repHitPraise: ['נוכחות מדהימה.', 'סנכרון קוונטי בינך לבין {dogName}!', 'וואו, הצ׳אקרות שלכם פתוחות לגמרי!', '🔥 תדר גבוה בטירוף! x{comboCount} של אור!'],
    repStruggleCoach: 'הכול בסדר, זה חלק מהמסע. מורידים קושי ונושמים יחד.',
    sessionCompleteBtn: 'לסגור את המעגל',
    antiCheatSpeedWarning: 'רגע, נשימה. אילוף אמיתי קורה בשטח עם {dogName}, לא מהאצבעות על המסך.',
    streakRescueUrgentBanner: '{streakDays} ימים של נוכחות. שישים שניות של "גע" שומרות על הזרימה עד חצות.',
    leagueOvertakenAlert: 'לא ממקום תחרותי או רעיל, אבל מישהו בליגה עבר את התדר שלנו.',
    lootBoxTapPrompt: ['תן לה לרטוט…', 'היא נפתחת לאט, כמו לוטוס.', 'קבל את המתנה מהיקום.'],
  },
};

export const ANXIOUS_MOM: PersonaDefinition = {
  id: 'ANXIOUS_MOM',
  nameHe: 'האמא הפולנייה הלחוצה',
  taglineHe: 'רק שתאכלו ותתאמנו',
  copy: {
    homeGreetingMorning: 'נו, באמת תודה שנזכרת ש־{dogName} קיים! כל היום הוא שוכב ליד הדלת ונאנח.',
    homeGreetingEvening: 'כבר ערב ועוד לא שאלת מה שלומו? טוב, {streakDays} ימים ברצף, אז אני לא אגיד כלום.',
    vitalityHigh: 'תראה איך {dogName} פורח, קיינעהורה! רק שלא יתקרר.',
    vitalityLowWarning: 'הלב שלי נשבר לראות את {dogName} ככה משועמם בחושך, אבל אל תדאג לי, אני אשב לבד.',
    sessionStartCta: 'נו, תתחיל כבר, הוא מחכה',
    repHitPraise: ['יופי, רק שלא יתאמץ מדי.', 'גאון של אמא ה־{dogName} הזה!', 'טפו טפו טפו איזה כלב חכם!', '🔥 גוועלד x{comboCount}! תן לו לנוח ולשתות מים!'],
    repStruggleCoach: 'לא נורא מותק, גם אתה לא למדת ללכת ביום אחד. משהו קל, ונחזור.',
    sessionCompleteBtn: 'סיימנו, עכשיו תן לו מים',
    antiCheatSpeedWarning: 'לאט לאט! מה הלחץ? אילוף אמיתי זה בחוץ עם {dogName}, לא ללחוץ על הטלפון כמו מטורף.',
    streakRescueUrgentBanner: 'אוי ויי, {streakDays} ימים הולכים לאיבוד! דקה אחת של "גע", זה כל מה שאני מבקשת.',
    leagueOvertakenAlert: 'ראית? הכלב של השכנים כבר עקף את {dogName} בליגה, איזה בושות בחדר מדרגות!',
    lootBoxTapPrompt: ['תפתח בעדינות, שלא יישבר', 'אוי, זה נסדק! זה בסדר?', 'נו, תפתח כבר, אני מתה מסקרנות!'],
  },
};
