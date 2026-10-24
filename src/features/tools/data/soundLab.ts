import type { SoundTrigger } from '../types';

// Systematic desensitization and counter-conditioning for noise sensitivity. The recordings themselves
// are added only once licensed (see SoundTrigger.source); until then the lab shows the protocol.

export const SOUND_TRIGGERS: readonly SoundTrigger[] = [
  { id: 'thunderstorm', titleHe: 'סופת רעמים', whyHe: 'סופות החורף בישראל מגיעות פתאום, בעוצמה – והרבה כלבים מפתחים פחד מצטבר.', icon: 'thunderstorm-outline', source: null },
  { id: 'fireworks', titleHe: 'זיקוקים', whyHe: 'יום העצמאות, חתונות ואירועים – פיצוצים לא צפויים מכל הכיוונים.', icon: 'sparkles-outline', source: null },
  { id: 'sirens', titleHe: 'אזעקות', whyHe: 'צפירות ואזעקות הן חלק מהחיים כאן; כלב שמוכן להן נכנס איתכם למרחב המוגן בשקט.', icon: 'megaphone-outline', source: null },
  { id: 'baby-cry', titleHe: 'בכי תינוק', whyHe: 'הכנה לתינוק שמגיע הביתה – הכלב לומד שהבכי הוא רעש רגיל, לא איום.', icon: 'happy-outline', source: null },
];

/** Volume steps on the fader: 1 is barely audible, 10 is full volume. */
export const VOLUME_STEPS = 10;

export const DESENSITIZATION_PROTOCOL_HE: readonly string[] = [
  'מתחילים בשלב 1 – כל כך חלש שהכלב כמעט לא מגיב. כלב שמפסיק לאכול או נדרך – העוצמה גבוהה מדי.',
  'הצליל מתחיל – החטיפים מתחילים. הצליל נגמר – החטיפים נגמרים. כך הרעש הופך לסימן לדבר טוב (התניה נגדית).',
  'אימונים קצרים של 2–5 דקות. עולים שלב אחד רק אחרי 2–3 אימונים רגועים ברצף.',
  'סימני עקה (ליקוק שפתיים, פיהוק, רעד, הסתתרות) – יורדים שני שלבים ומסיימים בהצלחה.',
  'לעולם לא "הצפה": לא מגבירים כדי "שיתרגל". פחד רעשים קשה – פונים לווטרינר מומחה להתנהגות.',
];

/** Shown while no licensed recording is installed for a sound. */
export const RECORDING_MISSING_HE = 'ההקלטה לסוג הזה עוד לא נוספה לאפליקציה. בינתיים אפשר לעבוד לפי הפרוטוקול עם הקלטה ביתית בעוצמה נמוכה.';
