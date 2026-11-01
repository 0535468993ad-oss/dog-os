// The dopamine engine: awardXp (multiplier, cap, level-up events), badges, reward claims, and the
// rank/reward/badge data.
import { BADGES } from '../data/badgesData';
import { AVATAR_FRAMES } from '../data/lootTable';
import { RANKS } from '../data/ranksData';
import { LEVEL_REWARDS } from '../data/rewardsData';
import { awardXp, checkBadgeProgress, claimReward } from '../services/gamificationEngine';
import type { GameState, SessionRecord } from '../types';
import { EMPTY_GAME_STATE } from '../utils/gameState';
import { completeSession } from '../utils/integrity';
import { badgesView, rewardsView, toGamificationState } from '../utils/view';

const TODAY = '2026-10-22';
const NOW = Date.parse('2026-10-22T12:00:00Z');

/** n sessions of a command today. */
function sessions(n: number, commandId: string, environment: SessionRecord['environment'] = 'HOME_QUIET'): SessionRecord[] {
  return Array.from({ length: n }, (_, i) => ({ commandId, track: 'FORCE_FREE', environment, day: TODAY, at: i, xp: 40 }));
}

const at = (state: Partial<GameState>): GameState => ({ ...EMPTY_GAME_STATE, ...state });

describe('ranks, rewards and badges data', () => {
  it('has ten ranks with the spec titles and no alpha framing', () => {
    expect(RANKS.map((rank) => rank.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(RANKS.map((rank) => rank.titleHe)).toEqual(['קשב בסיסי', 'מיקוד ומשמעת', 'יציבות בשטח', 'תקשורת בהירה', 'שליטה בהסחות', 'דרייב מבוקר', 'משמעת מתקדמת', 'עבודה חופשית', 'שותפות עילית', 'עוצמה מאוזנת']);
    expect(RANKS.filter((rank) => /אלפא|alpha/i.test(rank.titleHe))).toEqual([]);
    // Hebrew UI: no Latin letters in any rank title.
    expect(RANKS.filter((rank) => /[A-Za-z]/.test(rank.titleHe))).toEqual([]);
    for (const [index, rank] of RANKS.entries()) {
      const next = RANKS[index + 1];
      if (next) expect(rank.maxXp).toBe(next.minXp - 1);
    }
  });

  it('attaches the directive’s rewards to their levels', () => {
    const byLevel = (level: number) => LEVEL_REWARDS.filter((reward) => reward.levelRequired === level).map((reward) => reward.rewardType);
    expect(byLevel(3)).toEqual(['SOUND_TOOL']);
    expect(byLevel(4)).toEqual(['AI_UPGRADE']);
    expect(byLevel(5)).toEqual(['DIPLOMA_PDF', 'DISCOUNT_VOUCHER']);
    expect(byLevel(6)).toEqual(['WHISTLE']);
    expect(byLevel(7)).toEqual(['PROFILE_SKIN']);
    expect(byLevel(9)).toEqual(['WEB_TAG']);
    expect(RANKS.find((rank) => rank.level === 5)?.bonusReward?.rewardType).toBe('DISCOUNT_VOUCHER');
  });

  it('keeps rewards that need outside inputs locked', () => {
    const comingSoon = LEVEL_REWARDS.filter((reward) => reward.availability === 'COMING_SOON').map((reward) => reward.id);
    expect(comingSoon).toEqual(['ai-nutrition-mode', 'voucher-treats-10', 'ai-behavior-mode', 'web-id-tag', 'vip-beta']);
  });

  it('describes rewards and frames in the warm palette only', () => {
    const copy = [...LEVEL_REWARDS.flatMap((reward) => [reward.titleHe, reward.descriptionHe]), ...AVATAR_FRAMES.map((frame) => frame.nameHe)];
    expect(copy.filter((text) => /ציאן|מנטה|טורקיז|תכלת/.test(text))).toEqual([]);
  });

  it('defines the seven badges', () => {
    expect(BADGES.map((badge) => badge.id)).toEqual(['toxin_shield', 'recall_god', 'zen_master', 'street_fighter', 'flame_keeper_3', 'flame_keeper_7', 'flame_keeper_30']);
  });
});

describe('awardXp', () => {
  it('fires a level-up event when a threshold is crossed', () => {
    const result = awardXp(at({ totalXp: 90, activeDays: [TODAY] }), { amount: 40, reason: 'test', now: NOW, today: TODAY });
    expect(result.awarded).toBe(40);
    expect(result.events).toEqual([
      { type: 'XP_AWARDED', amount: 40, multiplier: 1, reason: 'test' },
      { type: 'LEVEL_UP', from: 1, to: 2 },
    ]);
  });

  it('caps the day at 300 and reports it', () => {
    const result = awardXp(at({ xpByDay: { [TODAY]: 290 }, totalXp: 290, activeDays: [TODAY] }), { amount: 40, reason: 'test', now: NOW, today: TODAY });
    expect(result).toMatchObject({ awarded: 10, capped: true });
  });
});

describe('badges', () => {
  it('unlocks recall_god at 20 recall sessions, through a real session', () => {
    const before = at({ sessions: sessions(19, 'recall'), activeDays: [TODAY] });
    const outcome = completeSession(before, { commandId: 'recall', xpReward: 50, track: 'FORCE_FREE', balancedAccess: 'GRANTED', environment: 'HOME_QUIET', startedAt: NOW - 180_000, now: NOW, today: TODAY, hour: 3, mode: 'STANDARD' });
    expect(outcome.events).toContainEqual({ type: 'BADGE_UNLOCKED', badgeId: 'recall_god' });
    expect(outcome.state.badgeUnlockedAt.recall_god).toBe(new Date(NOW).toISOString());
  });

  it('needs the toxin review on top of five leave-it sessions', () => {
    const trained = at({ sessions: sessions(5, 'leave-it') });
    expect(badgesView(trained).find((badge) => badge.id === 'toxin_shield')?.progress).toEqual({ current: 5, target: 6 });
    const reviewed = checkBadgeProgress(trained, { type: 'TOXIN_REVIEWED' }, NOW);
    expect(reviewed.events).toEqual([{ type: 'BADGE_UNLOCKED', badgeId: 'toxin_shield' }]);
    expect(reviewed.state.toxinReviewedAt).toBe(NOW);
  });

  it('counts five outdoor sessions for street_fighter and one stay/place for zen_master', () => {
    const view = badgesView(at({ sessions: [...sessions(5, 'heel', 'OUTDOOR_STIMULI'), ...sessions(1, 'place')] }));
    expect(view.find((badge) => badge.id === 'street_fighter')?.progress).toEqual({ current: 5, target: 5 });
    expect(view.find((badge) => badge.id === 'zen_master')?.progress).toEqual({ current: 1, target: 1 });
  });
});

describe('rewards', () => {
  it('claims only available rewards the rank allows, once', () => {
    const level6 = at({ totalXp: 1300, activeDays: Array.from({ length: 8 }, (_, i) => `2026-10-0${i + 1}`) });
    expect(claimReward(at({}), 'whistle').refused).toBe('LEVEL_TOO_LOW');
    expect(claimReward(level6, 'voucher-treats-10').refused).toBe('COMING_SOON');
    const claimed = claimReward(level6, 'whistle');
    expect(claimed.refused).toBeUndefined();
    expect(claimReward(claimed.state, 'whistle').refused).toBe('ALREADY_CLAIMED');
    expect(rewardsView(claimed.state).find((reward) => reward.id === 'whistle')?.status).toBe('CLAIMED');
    expect(rewardsView(claimed.state).find((reward) => reward.id === 'profile-skin-tactical')?.status).toBe('LOCKED');
  });

  it('exposes the public GamificationState', () => {
    expect(toGamificationState(at({ totalXp: 120, activeDays: [TODAY], claimedRewards: ['feature-foundation'] }), TODAY)).toEqual({
      totalXp: 120,
      currentLevel: 2,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: TODAY,
      multiplier: 1,
      unlockedBadges: [],
      claimedRewards: ['feature-foundation'],
    });
  });
});
