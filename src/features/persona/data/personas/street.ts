import type { PersonaDefinition } from '../../types';

// The two loud personas: the neighbourhood guy and the drill sergeant. Humour only – never about the dog's
// health, and no dominance framing of the dog.

export const ARS: PersonaDefinition = {
  id: 'ARS',
  nameHe: 'הערס השכונתי',
  taglineHe: 'כל אימון זה כבוד לשכונה',
  copy: {
    homeGreetingMorning: 'או! המלך חזר לשכונה! תראה איך {dogName} יושב כמו כריש מחכה לפקודה.',
    homeGreetingEvening: 'ערב טוב יא מלך! {streakDays} ימים ברצף, ו־{dogName} כבר מחכה ליד הדלת לסיבוב של הערב.',
    vitalityHigh: '{dogName} בפול פאוור אחי! חד כמו סכין, אל תעצור עכשיו.',
    vitalityLowWarning: 'שמע יא אח, {dogName} פה נהיה שטיח בסלון, משעמם לו ת׳חיים. זרוק לו איזה תרגיל תעיר אותו!',
    sessionStartCta: 'יאללה, קום תעשה עבודה!',
    repHitPraise: ['וואלה יפה!', 'בום! פגע בול הכריש!', 'חביבי {dogName} נהיה פרופסור!', '🔥 אטרף של החיים! x{comboCount} יא מלך!'],
    repStruggleCoach: 'סבבה אחי, קורה. מורידים הילוך, נותנים לו משהו קל וחוזרים.',
    sessionCompleteBtn: 'סגרנו! תרשום לי את זה',
    antiCheatSpeedWarning: 'וואלה לאט לאט נסיך! אילוף אמיתי זה בשטח עם {dogName}, לא לדפוק על המסך.',
    streakRescueUrgentBanner: 'אחי, {streakDays} ימים ברצף הולכים לפח! דקה אחת של "גע" ואתה מציל ת׳כבוד!',
    leagueOvertakenAlert: 'שמע לי טוב כפרה, עקפו אותך ואת {dogName} בליגה! מה נהיה? כנס תן אימון תחזיר ת׳כבוד!',
    lootBoxTapPrompt: ['תדפוק עליה אחי!', 'עוד אחת, היא נסדקת!', 'פתח ת׳אוצר יא מלך!'],
  },
};

export const DRILL_SERGEANT: PersonaDefinition = {
  id: 'DRILL_SERGEANT',
  nameHe: 'הרס״ר הצבאי',
  taglineHe: 'משמעת, דיוק, ואפס תירוצים',
  copy: {
    homeGreetingMorning: 'הקשב! המאסטר והלוחם {dogName} התייצבו במסדר! רצועה ביד, יוצאים למסלול!',
    homeGreetingEvening: 'מסדר ערב! {streakDays} ימי רצף. {dogName} מוכן לתרגיל לילה?',
    vitalityHigh: 'כשירות מבצעית מלאה! {dogName} חד ומוכן למשימה.',
    vitalityLowWarning: 'הפקרות! החייל {dogName} מאבד כשירות מבצעית בגלל חוסר תרגול! צא למסדר מייד!',
    sessionStartCta: 'למסדר – צעד!',
    repHitPraise: ['ביצוע תקין!', 'דיוק מבצעי!', '{dogName} פועל כמו יחידת עילית!', '🔥 משמעת ברזל! x{comboCount} ללא דופי!'],
    repStruggleCoach: 'עצור! מורידים רמת קושי ומבצעים שוב – בשקט, בלי כעס, בדיוק.',
    sessionCompleteBtn: 'סיום תרגיל – לדווח!',
    antiCheatSpeedWarning: 'עצור מייד! קצב מהיר מדי. אילוף אמיתי מתבצע בשטח עם {dogName}!',
    streakRescueUrgentBanner: 'התראה! רצף של {streakDays} ימים בסכנה! 60 שניות של "גע" – לבצע לפני חצות!',
    leagueOvertakenAlert: 'ביזיון במחלקה! צוות יריב עקף את {dogName} בטבלה! חזור לאימון והחזר את המקום!',
    lootBoxTapPrompt: ['הכן ארגז!', 'הארגז נסדק – להמשיך!', 'פתח!'],
  },
};
