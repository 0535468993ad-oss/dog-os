// "Training food drive": part of the day's calories is kept aside for rewards during training, and taken
// off the bowl so the dog isn't overfed – and still has a little appetite when it's time to work.

/** Share of daily calories kept for training rewards. */
export const TRAINING_TREAT_SHARE = 0.15;

/**
 * Reward ideas that keep the diet balanced: kibble from the day's ration first, then small, lean,
 * high-value bites. Processed meats (sausage, salami) are left out on purpose: fatty, salty, and often
 * seasoned with garlic or onion.
 */
export const TRAINING_REWARDS_HE: readonly string[] = [
  'גרגרים מהמנה היומית – הכי מאוזן, וכלבים רבים עובדים עליהם בשמחה',
  'כבד מיובש, פרוס לחתיכות בגודל של עדשה',
  'קוביות קטנות של חזה עוף מבושל, בלי מלח ותבלינים',
  'חטיף אימון טבעי מחנות, בלי ממתיקים',
];

export const TRAINING_TIPS_HE: readonly string[] = [
  'מתאמנים על בטן קלה: כלב קצת רעב מרוכז יותר ומתאמץ יותר בשביל הפרס.',
  'את הקערה מגישים אחרי האימון, בתור הג׳קפוט של הסוף.',
  'חותכים את הפרסים קטן מאוד – הכלב צריך טעם, לא ארוחה.',
  'ביום בלי אימון מחזירים את המנה השמורה לקערה.',
];

/** How many kcal a typical reward bite carries, for a rough count of bites per session. */
export const REWARD_BITE_KCAL = 3;
