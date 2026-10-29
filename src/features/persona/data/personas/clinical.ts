import type { PersonaDefinition } from '../../types';

// The default persona, and the only one emergency flows use: precise, clinical and evidence-based.

export const CLINICAL_PRO: PersonaDefinition = {
  id: 'CLINICAL_PRO',
  nameHe: 'הפרופסור לאתולוגיה',
  taglineHe: 'מדויק, מבוסס מחקר (ברירת מחדל)',
  icon: 'medkit-outline',
  copy: {
    homeGreetingMorning: 'בוקר טוב. אימון קצר בבוקר, כש־{dogName} רגוע יחסית, מאפשר למידה מדויקת.',
    homeGreetingEvening: 'ערב טוב. {streakDays} ימי תרגול רצופים מחזקים את העקביות של {dogName}.',
    vitalityHigh: 'המדדים של {dogName} גבוהים: תרגול סדיר ומגוון. שמרו על הקצב.',
    vitalityLowWarning: 'לא תועד אימון לאחרונה. גירוי מחשבתי סדיר מפחית שעמום אצל {dogName}. מומלץ סשן של 3–5 דקות.',
    sessionStartCta: 'התחלת סשן',
    repHitPraise: ['ביצוע תקין.', 'תזמון מרקר מדויק.', '{dogName} מגיב בעקביות.', '🔥 רצף של x{comboCount} – שיעור הצלחה גבוה.'],
    repStruggleCoach: 'שיעור ההצלחה ירד. הורידו קריטריון אחד – מרחק, משך או הסחה – כדי לחזור לכ־80% הצלחה.',
    sessionCompleteBtn: 'סיום ותיעוד הסשן',
    antiCheatSpeedWarning: 'קצב הרישום מהיר מדי. הרישום אמור לשקף תרגול מעשי עם {dogName}, לא לחיצות על המסך.',
    streakRescueUrgentBanner: 'רצף של {streakDays} ימים יסתיים בחצות. תרגיל "גע" של 60 שניות שומר עליו.',
    leagueOvertakenAlert: '{dogName} ירד מקום בטבלה השבועית. סשן נוסף יחזיר אתכם.',
    lootBoxTapPrompt: ['לחצו לפתיחה', 'עוד לחיצה', 'חשיפת הפרס'],
  },
};
