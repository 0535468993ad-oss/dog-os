// Gamification card polish: podium place badges, the highlighted user row, the compact vitality meters,
// the streak flame and the metallic trophy tiles.
import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, tints } from '@/constants/theme';

import { BadgeGrid } from '../components/BadgeGrid';
import { DogVitalityCard } from '../components/DogVitalityCard';
import { StreakBadge } from '../components/StreakBadge';
import { WeeklyLeagueCard } from '../components/WeeklyLeagueCard';
import type { Badge, LeagueStandings, Vitality } from '../types';
import { EMPTY_GAME_STATE } from '../utils/gameState';
import { badgesView } from '../utils/view';

const flat = (element: { props: { style?: unknown } }) => StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

const standings: LeagueStandings = {
  tier: 0,
  rows: [
    { id: 'a', nameHe: 'יריב א', xp: 420, isUser: false },
    { id: 'b', nameHe: 'יריב ב', xp: 380, isUser: false },
    { id: 'c', nameHe: 'יריב ג', xp: 300, isUser: false },
    { id: 'me', nameHe: 'אני', xp: 250, isUser: true },
  ],
  userRank: 4,
  zone: 'SAFE',
  overtakenBy: [],
};

describe('WeeklyLeagueCard', () => {
  it('gives places 1–3 gold, silver and bronze badges and leaves the rest plain', async () => {
    await render(<WeeklyLeagueCard standings={standings} overtakenAlertHe={null} />);

    expect(flat(screen.getByTestId('league-place-1')).backgroundColor).toBe(tints.medalGold);
    expect(flat(screen.getByTestId('league-place-2')).backgroundColor).toBe(tints.medalSilver);
    expect(flat(screen.getByTestId('league-place-3')).backgroundColor).toBe(tints.medalBronze);
    expect(flat(screen.getByTestId('league-place-4')).backgroundColor).toBeUndefined();
    expect(flat(screen.getByText('1')).color).toBe(colors.medalGold);
  });

  it('highlights the user row in amber and keeps XP digits tabular', async () => {
    await render(<WeeklyLeagueCard standings={standings} overtakenAlertHe={null} />);

    expect(flat(screen.getByTestId('league-user-row'))).toMatchObject({
      backgroundColor: tints.primaryHighlight,
      borderColor: tints.primaryHighlightBorder,
    });
    expect(flat(screen.getByText('250 XP')).fontVariant).toEqual(['tabular-nums']);
    expect(screen.getByLabelText('מקום 4: אני, 250 XP')).toBeOnTheScreen();
  });
});

describe('DogVitalityCard', () => {
  const empty: Vitality = { meters: { sharpness: 0, drive: 0, calm: 0, bond: 0 }, overall: 0, weakest: 'sharpness', suggestedCommandId: 'sit' };

  it('lays each meter on one compact line and keeps empty tracks visible', async () => {
    await render(<DogVitalityCard dogName="ג׳קסון" vitality={empty} commentHe="בואו נתחיל." suggestedCommandNameHe="שב" onLaunch={jest.fn()} />);

    expect(screen.getAllByRole('progressbar')).toHaveLength(4);
    expect(screen.getAllByTestId('progress-empty')).toHaveLength(4);
    const row = screen.getByText('חדות מוחית').parent;
    expect(row && flat(row)).toMatchObject({ flexDirection: 'row', alignItems: 'center' });
    expect(Number(flat(screen.getByText(/לא מדד בריאותי/)).marginTop)).toBeGreaterThan(0);
  });
});

describe('StreakBadge', () => {
  it('lights the flame and shows the multiplier chip on an active streak', async () => {
    await render(<StreakBadge streak={7} multiplier={1.5} />);
    expect(screen.getByLabelText('רצף של 7 ימים, מכפיל 1.5')).toBeOnTheScreen();
    expect(flat(screen.getByText('×1.5')).color).toBe(colors.onAccent);
    expect(flat(screen.getByTestId('streak-flame')).backgroundColor).toBe(colors.warningMuted);
  });

  it('stays dim with the multiplier hint when there is no streak', async () => {
    await render(<StreakBadge streak={0} multiplier={1} />);
    expect(screen.getByLabelText('אין רצף פעיל')).toBeOnTheScreen();
    expect(screen.getByText('מכפיל ×1.2 מ־3 ימים, ×1.5 מ־7')).toBeOnTheScreen();
    expect(screen.queryByText(/^×/)).toBeNull();
  });
});

describe('BadgeGrid', () => {
  const locked = badgesView(EMPTY_GAME_STATE);
  const unlock = (badges: Badge[], id: Badge['id']): Badge[] =>
    badges.map((badge) => (badge.id === id ? { ...badge, isUnlocked: true, unlockedAt: '2026-10-29T08:00:00.000Z', progress: { ...badge.progress, current: badge.progress.target } } : badge));

  it('gives an unlocked badge a metallic border in its tier tone and marks it earned', async () => {
    await render(<BadgeGrid badges={unlock(locked, 'street_fighter')} onReviewToxins={jest.fn()} />);
    const tile = flat(screen.getByTestId('badge-street_fighter'));
    expect(tile).toMatchObject({ borderWidth: 2, borderColor: colors.medalGold, shadowColor: colors.medalGold });
    expect(screen.getByLabelText(/^גיבור השטח, זהב: הושג\./)).toBeOnTheScreen();
  });

  it('shows progress and requirements on locked badges, and the toxin review step', async () => {
    const onReviewToxins = jest.fn();
    await render(<BadgeGrid badges={locked} onReviewToxins={onReviewToxins} />);
    expect(screen.getByLabelText(/^גיבור השטח, זהב: 0 מתוך 5\. 5 אימונים בחוץ/)).toBeOnTheScreen();
    expect(flat(screen.getByTestId('badge-recall_god')).borderWidth).toBe(1);

    await userEvent.press(screen.getByRole('button', { name: 'סקירת המזונות הרעילים' }));
    expect(onReviewToxins).toHaveBeenCalledTimes(1);
  });
});

