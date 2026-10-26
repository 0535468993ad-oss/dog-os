import type { ColorToken } from '@/constants/theme';

// Public gamification contracts: badges, level rewards, the rank ladder, and the summary state the UI
// reads. The engine's internal state (session log, anti-cheat) is in state.types.ts.

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
export type BadgeCategory = 'OBEDIENCE' | 'SAFETY_EMERGENCY' | 'STREAK' | 'ENVIRONMENTAL_HERO';

export type BadgeId = 'toxin_shield' | 'recall_god' | 'zen_master' | 'street_fighter' | 'flame_keeper_3' | 'flame_keeper_7' | 'flame_keeper_30';

export interface Badge {
  id: BadgeId;
  titleHe: string;
  descriptionHe: string;
  category: BadgeCategory;
  tier: BadgeTier;
  /** Ionicons glyph name. */
  iconName: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: { current: number; target: number };
}

/** A badge as defined in data – unlock state and progress are computed from the game state. */
export type BadgeDefinition = Omit<Badge, 'isUnlocked' | 'unlockedAt' | 'progress'> & { target: number };

/**
 * What a level unlocks. FEATURE_ACCESS marks app areas that are open from day one (levels 1–2 point
 * to them); safety content is never gated behind a level.
 */
export type RewardType = 'SOUND_TOOL' | 'WHISTLE' | 'AI_UPGRADE' | 'DIPLOMA_PDF' | 'DISCOUNT_VOUCHER' | 'PROFILE_SKIN' | 'WEB_TAG' | 'FEATURE_ACCESS';

/** COMING_SOON: needs something outside the app first (a partner, a backend, reviewed prompts). */
export type RewardAvailability = 'AVAILABLE' | 'COMING_SOON';

export interface LevelReward {
  id: string;
  levelRequired: number;
  titleHe: string;
  descriptionHe: string;
  rewardType: RewardType;
  /** Which in-app module the reward opens. */
  payloadKey: string;
  isClaimed: boolean;
  availability: RewardAvailability;
}

export interface RankTier {
  level: number;
  titleHe: string;
  titleEn: string;
  minXp: number;
  maxXp: number;
  /** Distinct training days required from level 4 on: XP alone cannot buy a rank. */
  minActiveDays: number;
  themeColor: ColorToken;
  perkDescriptionHe: string;
  unlockedReward: LevelReward;
  /** Levels 5 and 10 unlock a second reward. */
  bonusReward?: LevelReward;
}

/** A rank as shown on cards: the ladder entry plus the perk it carries. */
export interface DogRank {
  level: number;
  titleHe: string;
  minXp: number;
  maxXp: number;
  /** The rank's perk, in one line. */
  perkBadge: string;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** Last day with training (YYYY-MM-DD), or '' before the first one. */
  lastActiveDate: string;
  multiplier: number;
}

/** Everything a profile screen needs about one dog's progress. */
export interface UserGamificationProfile {
  dogId: string;
  totalXp: number;
  currentLevel: number;
  rankTitle: string;
  streak: StreakState;
  badges: Badge[];
}

export interface GamificationState {
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  /** Last day with a session (YYYY-MM-DD), or '' before the first one. */
  lastActiveDate: string;
  multiplier: number;
  unlockedBadges: string[];
  claimedRewards: string[];
}

export type QuestId = 'MORNING_PATROL' | 'IMPULSE_CONTROL' | 'STREAK_RESCUE';

/** A time-of-day quest: [fromHour, toHour) local time, and the commands it pays a bonus on. */
export interface QuestDefinition {
  id: QuestId;
  fromHour: number;
  toHour: number;
  titleHe: string;
  commandIds: readonly string[];
  bonusHe: string;
}

export type LootTier = 'COMMON' | 'RARE' | 'LEGENDARY';

/** What a loot box paid out. xpAwarded can be below xpRolled when the daily cap is reached. */
export type LootReward =
  | { tier: 'COMMON'; xpRolled: number; xpAwarded: number; bones: number }
  | { tier: 'RARE'; cardId: string; frameId: string }
  | { tier: 'LEGENDARY'; kind: 'SHIELD' }
  | { tier: 'LEGENDARY'; kind: 'TITLE'; titleId: string };

/** An ethology fact unlocked by a rare drop. */
export interface IntelCard {
  id: string;
  titleHe: string;
  factHe: string;
  sourceHe: string;
}

export type VitalityMeter = 'sharpness' | 'drive' | 'calm' | 'bond';

/** The four game meters, 0–100, derived from the training log. */
export interface Vitality {
  meters: Record<VitalityMeter, number>;
  overall: number;
  weakest: VitalityMeter;
  /** The command that would lift the weakest meter most. */
  suggestedCommandId: string;
}

/** One row of the weekly league table. */
export interface LeagueRow {
  id: string;
  nameHe: string;
  xp: number;
  isUser: boolean;
}

export type LeagueZone = 'PROMOTION' | 'SAFE' | 'DEMOTION';

export interface LeagueStandings {
  tier: number;
  rows: LeagueRow[];
  /** 1-based. */
  userRank: number;
  zone: LeagueZone;
  /** Rivals who passed the user since the end of yesterday. */
  overtakenBy: string[];
}
