import type { BadgeDefinition, BadgeId } from '../types';

// Trophy badges. Every target counts real sessions (each needs three live minutes) or real days.

export const BADGES: readonly BadgeDefinition[] = [
  { id: 'toxin_shield', titleHe: 'מגן הרעלים', descriptionHe: 'סקירת רשימת המזונות הרעילים ו־5 אימוני "לא לגעת"', category: 'SAFETY_EMERGENCY', tier: 'GOLD', iconName: 'shield-checkmark', target: 6 },
  { id: 'recall_god', titleHe: 'אלוף הקריאה', descriptionHe: '20 אימוני "אליי" מוצלחים', category: 'SAFETY_EMERGENCY', tier: 'DIAMOND', iconName: 'magnet', target: 20 },
  { id: 'zen_master', titleHe: 'מאסטר רוגע', descriptionHe: '3 דקות רצופות של "הישאר" או "למקום"', category: 'OBEDIENCE', tier: 'SILVER', iconName: 'leaf', target: 1 },
  { id: 'street_fighter', titleHe: 'גיבור השטח', descriptionHe: '5 אימונים בחוץ, עם גירויים', category: 'ENVIRONMENTAL_HERO', tier: 'GOLD', iconName: 'walk', target: 5 },
  { id: 'flame_keeper_3', titleHe: 'שומר הלהבה', descriptionHe: '3 ימי אימון רצופים', category: 'STREAK', tier: 'BRONZE', iconName: 'flame', target: 3 },
  { id: 'flame_keeper_7', titleHe: 'שומר הלהבה – שבוע', descriptionHe: '7 ימי אימון רצופים', category: 'STREAK', tier: 'SILVER', iconName: 'flame', target: 7 },
  { id: 'flame_keeper_30', titleHe: 'שומר הלהבה – חודש', descriptionHe: '30 ימי אימון רצופים', category: 'STREAK', tier: 'DIAMOND', iconName: 'bonfire', target: 30 },
];

/** Streak badges were renamed to flame_keeper_*; states saved earlier are read with the old ids. */
export const LEGACY_BADGE_IDS: Readonly<Record<string, BadgeId>> = {
  streak_warrior_3: 'flame_keeper_3',
  streak_warrior_7: 'flame_keeper_7',
  streak_legend_30: 'flame_keeper_30',
};

export const BADGE_TIER_LABELS_HE = { BRONZE: 'ארד', SILVER: 'כסף', GOLD: 'זהב', DIAMOND: 'יהלום' } as const;
