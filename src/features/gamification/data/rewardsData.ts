import type { LevelReward } from '../types';

// The reward unlocked at each level. COMING_SOON rewards need something outside the app first – a real
// partner for a voucher, a public-profile backend, reviewed AI prompts – and are shown locked until then.

type RewardSeed = Omit<LevelReward, 'isClaimed'>;

export const LEVEL_REWARDS: readonly RewardSeed[] = [
  { id: 'feature-foundation', levelRequired: 1, rewardType: 'FEATURE_ACCESS', payloadKey: 'feature-foundation', availability: 'AVAILABLE', titleHe: 'פקודות היסוד ומדריכי החירום', descriptionHe: '9 פקודות המאסטר ומטבח החירום – פתוחים מהיום הראשון. בטיחות לא נועלים מאחורי דרגה.' },
  { id: 'feature-habits', levelRequired: 2, rewardType: 'FEATURE_ACCESS', payloadKey: 'feature-habits', availability: 'AVAILABLE', titleHe: 'מעקב הרגלים ויומן האכלה', descriptionHe: 'היומן היומי ומחשבון התזונה – לבנות שגרה שהכלב יכול לסמוך עליה.' },
  { id: 'sound-lab', levelRequired: 3, rewardType: 'SOUND_TOOL', payloadKey: 'sound-lab', availability: 'AVAILABLE', titleHe: 'מעבדת הרגלה לרעשים', descriptionHe: 'הרגלה הדרגתית לרעמים, זיקוקים, אזעקות ובכי תינוק – בעוצמה שעולה שלב אחרי שלב, בצמוד לחטיפים.' },
  { id: 'ai-nutrition-mode', levelRequired: 4, rewardType: 'AI_UPGRADE', payloadKey: 'ai-nutrition-mode', availability: 'COMING_SOON', titleHe: 'מצב יועץ תזונה מתקדם', descriptionHe: 'שיחה מעמיקה על תזונה לפי הכלב שלכם. בהכנה – לא מחליף ווטרינר או תזונאי וטרינרי.' },
  { id: 'certificate-foundation', levelRequired: 5, rewardType: 'DIPLOMA_PDF', payloadKey: 'certificate-foundation', availability: 'AVAILABLE', titleHe: 'תעודת יסודות', descriptionHe: 'תעודה להדפסה ולשיתוף עם שם הכלב, הגזע ותאריך ההשלמה.' },
  { id: 'voucher-treats-10', levelRequired: 5, rewardType: 'DISCOUNT_VOUCHER', payloadKey: 'voucher-treats-10', availability: 'COMING_SOON', titleHe: 'שובר 10% לחטיפי אימון', descriptionHe: 'ייפתח כשיהיה שותף אמיתי. לא ננפיק קוד שלא מכובד בחנות.' },
  { id: 'whistle', levelRequired: 6, rewardType: 'WHISTLE', payloadKey: 'whistle', availability: 'AVAILABLE', titleHe: 'משרוקית בתדר גבוה', descriptionHe: 'מחולל צליל 15–22 קילוהרץ לאות קריאה עקבי, עם רטט קצר.' },
  { id: 'profile-skin-tactical', levelRequired: 7, rewardType: 'PROFILE_SKIN', payloadKey: 'profile-skin-tactical', availability: 'AVAILABLE', titleHe: 'מסגרת פרופיל טקטית זוהרת', descriptionHe: 'מסגרת ברונזה זוהרת לכרטיס הדרגה של הכלב.' },
  { id: 'ai-behavior-mode', levelRequired: 8, rewardType: 'AI_UPGRADE', payloadKey: 'ai-behavior-mode', availability: 'COMING_SOON', titleHe: 'מצב מנתח התנהגות', descriptionHe: 'שיחה מעמיקה על חרדת נטישה ותגובתיות. בהכנה – לא מחליף יועץ התנהגות מוסמך.' },
  { id: 'web-id-tag', levelRequired: 9, rewardType: 'WEB_TAG', payloadKey: 'web-id-tag', availability: 'COMING_SOON', titleHe: 'תעודת זהות דיגיטלית עם QR', descriptionHe: 'כרטיס ציבורי לכלב עם קישור QR/NFC. בהכנה – ייפתח רק עם בחירה מפורשת שלכם מה יוצג לציבור.' },
  { id: 'certificate-grandmaster', levelRequired: 10, rewardType: 'DIPLOMA_PDF', payloadKey: 'certificate-grandmaster', availability: 'AVAILABLE', titleHe: 'תעודת גראנד־מאסטר', descriptionHe: 'התעודה הבכירה של Dog OS – להדפסה ולשיתוף.' },
  { id: 'vip-beta', levelRequired: 10, rewardType: 'FEATURE_ACCESS', payloadKey: 'vip-beta', availability: 'COMING_SOON', titleHe: 'גישת VIP לבטא', descriptionHe: 'גישה מוקדמת לכלים חדשים. ייפתח עם תוכנית הבטא.' },
];

/** The reward with this id, if any. */
export function findReward(id: string): RewardSeed | undefined {
  return LEVEL_REWARDS.find((reward) => reward.id === id);
}
