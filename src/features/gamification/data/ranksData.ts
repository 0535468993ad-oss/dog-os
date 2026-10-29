import type { LevelReward, RankTier } from '../types';
import { LEVEL_REWARDS } from './rewardsData';

// The ten ranks of the dog-and-handler team. XP thresholds are paired with distinct training days from
// level 4, so a rank cannot be bought in one long day. Titles are Hebrew-only, fit dogs of any age and
// avoid "alpha"/dominance framing.

/** The reward for a level, as an unclaimed LevelReward (the first one when a level has two). */
function rewardAt(level: number, index = 0): LevelReward {
  const seed = LEVEL_REWARDS.filter((reward) => reward.levelRequired === level)[index];
  if (!seed) throw new Error(`No reward for level ${level}`);
  return { ...seed, isClaimed: false };
}

/** A level's second reward, when it has one. */
function bonusAt(level: number): LevelReward | undefined {
  return LEVEL_REWARDS.filter((reward) => reward.levelRequired === level).length > 1 ? rewardAt(level, 1) : undefined;
}

type RankSeed = Omit<RankTier, 'unlockedReward' | 'bonusReward' | 'maxXp'>;

const SEEDS: readonly RankSeed[] = [
  { level: 1, titleHe: 'קשב בסיסי', minXp: 0, minActiveDays: 0, themeColor: 'textSecondary', perkDescriptionHe: 'פקודות היסוד ומדריכי החירום – הבסיס לכל השאר.' },
  { level: 2, titleHe: 'מיקוד ומשמעת', minXp: 100, minActiveDays: 0, themeColor: 'accentGold', perkDescriptionHe: 'שגרה יומית: יומן הרגלים והאכלה.' },
  { level: 3, titleHe: 'יציבות בשטח', minXp: 250, minActiveDays: 0, themeColor: 'accentGold', perkDescriptionHe: 'מעבדת ההרגלה לרעשים – זיקוקים, רעמים ואזעקות.' },
  { level: 4, titleHe: 'תקשורת בהירה', minXp: 500, minActiveDays: 3, themeColor: 'accentBronze', perkDescriptionHe: 'מצב יועץ תזונה מתקדם (בהכנה).' },
  { level: 5, titleHe: 'שליטה בהסחות', minXp: 800, minActiveDays: 5, themeColor: 'accentBronze', perkDescriptionHe: 'תעודת יסודות להדפסה, ושובר לחטיפי אימון (בהכנה).' },
  { level: 6, titleHe: 'דרייב מבוקר', minXp: 1200, minActiveDays: 8, themeColor: 'primary', perkDescriptionHe: 'משרוקית בתדר גבוה לאות קריאה עקבי.' },
  { level: 7, titleHe: 'משמעת מתקדמת', minXp: 1700, minActiveDays: 12, themeColor: 'accentOrange', perkDescriptionHe: 'מסגרת פרופיל טקטית זוהרת.' },
  { level: 8, titleHe: 'עבודה חופשית', minXp: 2300, minActiveDays: 16, themeColor: 'accentOrange', perkDescriptionHe: 'מצב מנתח התנהגות (בהכנה).' },
  { level: 9, titleHe: 'שותפות עילית', minXp: 3000, minActiveDays: 21, themeColor: 'ai', perkDescriptionHe: 'תעודת זהות דיגיטלית עם QR (בהכנה).' },
  { level: 10, titleHe: 'עוצמה מאוזנת', minXp: 4000, minActiveDays: 30, themeColor: 'aiBright', perkDescriptionHe: 'תעודת גראנד־מאסטר וגישת VIP לבטא.' },
];

/** The ladder, 1–10. maxXp is the XP just below the next rank; the top rank is open-ended. */
export const RANKS: readonly RankTier[] = SEEDS.map((seed, index) => {
  const next = SEEDS[index + 1];
  const bonus = bonusAt(seed.level);
  return {
    ...seed,
    maxXp: next ? next.minXp - 1 : Number.MAX_SAFE_INTEGER,
    unlockedReward: rewardAt(seed.level),
    ...(bonus ? { bonusReward: bonus } : {}),
  };
});
