import { AVATAR_FRAMES, INTEL_CARDS, VIP_TITLES } from '../data/lootTable';
import { LOOT_COMMON_RATE, LOOT_PITY_THRESHOLD, LOOT_RARE_RATE, MAX_STREAK_SHIELDS } from '../data/rules';
import type { GameState, LootReward, LootTier } from '../types';
import { awardXp } from './xpEngine';

// Loot boxes: one per verified session, opened with three taps. A variable-ratio drop table with a pity
// timer – after four boxes with nothing rare, the fifth is rare or legendary. Bonus XP still goes through
// awardXp, so the daily cap holds. The random source is injected, so every outcome is testable.

export type Random = () => number;

/** The tier of the next box: forced to rare-or-better once the pity timer is full. */
export function rollTier(boxesSinceLastRare: number, random: Random): LootTier {
  const roll = random();
  if (boxesSinceLastRare >= LOOT_PITY_THRESHOLD) return roll < 0.25 ? 'LEGENDARY' : 'RARE';
  if (roll < LOOT_COMMON_RATE) return 'COMMON';
  return roll < LOOT_COMMON_RATE + LOOT_RARE_RATE ? 'RARE' : 'LEGENDARY';
}

/** An item from a list, preferring ones not yet owned. */
function pick(items: readonly { id: string }[], owned: readonly string[], random: Random): string {
  const fresh = items.filter((item) => !owned.includes(item.id));
  const pool = fresh.length > 0 ? fresh : items;
  return pool[Math.floor(random() * pool.length) % pool.length]?.id ?? '';
}

/** Opens one pending box. */
export function openLootBox(state: GameState, random: Random, now: number, today: string): { state: GameState; reward?: LootReward; refused?: 'NO_BOX' } {
  const { loot } = state;
  if (loot.pendingBoxes <= 0) return { state, refused: 'NO_BOX' };
  const tier = rollTier(loot.boxesSinceLastRare, random);
  const opened = { ...loot, pendingBoxes: loot.pendingBoxes - 1, boxesSinceLastRare: tier === 'COMMON' ? loot.boxesSinceLastRare + 1 : 0 };

  if (tier === 'COMMON') {
    const xpRolled = 20 + Math.floor(random() * 26);
    const bones = 1 + Math.floor(random() * 3);
    const award = awardXp({ ...state, loot: opened }, { amount: xpRolled, reason: 'loot-box', now, today });
    return {
      state: { ...award.state, loot: { ...opened, goldenBones: opened.goldenBones + bones } },
      reward: { tier, xpRolled, xpAwarded: award.awarded, bones },
    };
  }
  if (tier === 'RARE') {
    const cardId = pick(INTEL_CARDS, opened.cards, random);
    const frameId = pick(AVATAR_FRAMES, opened.frames, random);
    const next = { ...opened, cards: [...new Set([...opened.cards, cardId])], frames: [...new Set([...opened.frames, frameId])] };
    return { state: { ...state, loot: next }, reward: { tier, cardId, frameId } };
  }
  if (state.streakShields < MAX_STREAK_SHIELDS) {
    return { state: { ...state, loot: opened, streakShields: state.streakShields + 1 }, reward: { tier, kind: 'SHIELD' } };
  }
  const titleId = pick(VIP_TITLES, opened.titles, random);
  return { state: { ...state, loot: { ...opened, titles: [...new Set([...opened.titles, titleId])] } }, reward: { tier, kind: 'TITLE', titleId } };
}
