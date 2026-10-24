// The high-frequency whistle: a consistent recall or attention signal, not a correction.

export const WHISTLE_MIN_HZ = 15_000;
export const WHISTLE_MAX_HZ = 22_000;
export const WHISTLE_STEP_HZ = 500;
export const WHISTLE_DEFAULT_HZ = 16_000;
/** One blast. Short bursts are a signal; a long tone is just noise. */
export const WHISTLE_BURST_MS = 600;
/** 44.1 kHz covers tones up to 22.05 kHz (Nyquist). */
export const WHISTLE_SAMPLE_RATE = 44_100;
/** Below full scale: dogs hear these frequencies far better than we do. */
export const WHISTLE_VOLUME = 0.6;

export const WHISTLE_GUIDE_HE: readonly string[] = [
  'קודם מלמדים את המשמעות: שריקה – ומיד חטיף שווה. 10–15 חזרות לפני שמשתמשים בה לקריאה.',
  'שריקות קצרות, בעוצמה בינונית, ולא קרוב לאוזני הכלב. זה אות – לא עונש.',
  'רמקולים של טלפונים מתקשים להשמיע מעל 18–20 קילוהרץ, ויש מבוגרים צעירים ששומעים עד כ־17. אם הכלב לא מגיב, נסו תדר נמוך יותר.',
];
