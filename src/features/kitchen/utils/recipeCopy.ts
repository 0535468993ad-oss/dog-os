// The recipe's fixed sentences. Plain, patient Hebrew – the way a good vet nurse explains it at the
// counter.

export const WEIGH_STEP = 'שוקלים כל רכיב אחרי הבישול, לפי הכמויות שבטבלה.';
export const COOL_STEP = 'מערבבים הכול יחד ומחכים שהאוכל יתקרר לטמפרטורת החדר. אוכל חם מדי שורף את הפה ומציק לבטן.';
export const STORE_STEP = 'את מה שנשאר שומרים במקרר בקופסה סגורה, עד יומיים, ומחממים מעט לפני ההגשה.';

/** How to feed the bland diet and when to stop and see the vet. */
export function servingAdvice(mealsPerDay: number): string {
  return [
    `מחלקים את האוכל ל־${mealsPerDay} ארוחות קטנות לאורך היום, כדי שהבטן תקבל כל פעם רק קצת.`,
    'ממשיכים כך יומיים–שלושה, ואז חוזרים לאט לאוכל הרגיל: בכל יום קצת יותר מהאוכל הרגיל וקצת פחות מהתפריט הזה.',
    'מים טריים תמיד בהישג יד.',
    'אם יש הקאות חוזרות, דם בצואה, חולשה, או שאין שיפור תוך 48 שעות – פונים לווטרינר.',
  ].join(' ');
}

export const MISSING_PROTEIN = 'חסר חלבון רזה: חזה עוף, חזה הודו, קוטג׳ דל שומן או ביצה.';
export const MISSING_CARB = 'חסרה פחמימה עדינה: אורז לבן, תפוח אדמה או בטטה.';
