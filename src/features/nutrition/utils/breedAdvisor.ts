import type { BreedAdvice, DogNutritionProfile } from '../types';

// Breed-specific nutrition advice. German Shepherd risks per the veterinary literature: hip and elbow
// dysplasia, gastric dilatation-volvulus (GDV, "bloat"), and a sensitive gut (incl. exocrine pancreatic
// insufficiency). Joint support leads with weight control and fish-oil omega-3, which has the strongest
// evidence; glucosamine is optional.

const GERMAN_SHEPHERD: BreedAdvice = {
  titleHe: 'מה חשוב לדעת על רועה גרמני',
  alertsHe: [
    'מפרקים ואגן: הגזע נוטה לדיספלזיה של הירך והמרפק – שחיקה שמתחילה לפעמים כבר בגיל צעיר.',
    'היפוך קיבה: מצב חירום שבו הקיבה מתמלאת גז ומתפתלת. מופיע בעיקר אחרי ארוחה גדולה ומאמץ.',
    'עיכול רגיש: הרבה רועים גרמניים מגיבים בשלשול לשינויי מזון פתאומיים.',
  ],
  adviceHe: [
    'הדבר הכי טוב למפרקים הוא משקל רזה: צריך להרגיש את הצלעות בקלות מתחת לשכבה דקה.',
    'שמן דגים (EPA ו־DHA) הוא התוסף עם הכי הרבה הוכחות למפרקים. גלוקוזאמין אפשר להוסיף, אבל ההוכחות לו חלשות יותר.',
    'מחלקים את האוכל לשתי ארוחות לפחות, ולא נותנים לרוץ או להשתולל שעה לפני ושעה אחרי האוכל.',
    'אם הכלב בולע מהר – קערת האטה עוזרת. סימני היפוך קיבה: בטן נפוחה, ניסיונות להקיא בלי שיוצא כלום, אי־שקט – נוסעים מיד לווטרינר.',
    'מחליפים מזון בהדרגה, במשך שבוע: כל יום קצת יותר מהחדש וקצת פחות מהישן.',
  ],
  recommendedProductIds: ['royal-canin-gsd-adult', 'proplan-large-athletic', 'hills-large-breed-adult', 'grizzly-salmon-oil', 'glucosamine-chondroitin'],
};

const LARGE_BREED: BreedAdvice = {
  titleHe: 'טיפים לכלבים גדולים',
  alertsHe: ['כלבים גדולים נוטים יותר לבעיות מפרקים ולהיפוך קיבה.'],
  adviceHe: [
    'שומרים על משקל רזה – זה מוריד עומס מהמפרקים יותר מכל תוסף.',
    'שתי ארוחות ביום לפחות, ומנוחה של שעה לפני ואחרי האוכל.',
    'שמן דגים יכול לעזור למפרקים. מתאמים את הכמות עם הווטרינר.',
  ],
  recommendedProductIds: ['royal-canin-maxi-adult', 'proplan-large-athletic', 'hills-large-breed-adult', 'grizzly-salmon-oil'],
};

const DEFAULT: BreedAdvice = {
  titleHe: 'טיפים לתזונה טובה',
  alertsHe: [],
  adviceHe: [
    'שומרים על משקל רזה – בודקים שאפשר להרגיש את הצלעות בקלות.',
    'מחליפים מזון בהדרגה, במשך שבוע, כדי לא להציק לבטן.',
  ],
  recommendedProductIds: [],
};

/** Advice for this dog: its breed's profile when we have one, else by size. */
export function breedAdviceFor(profile: Pick<DogNutritionProfile, 'breedId' | 'isLargeBreed'>): BreedAdvice {
  if (profile.breedId === 'german-shepherd') return GERMAN_SHEPHERD;
  if (profile.isLargeBreed) return LARGE_BREED;
  return DEFAULT;
}
