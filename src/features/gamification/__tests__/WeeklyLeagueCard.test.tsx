// League table polish: podium place badges and the highlighted user row.
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, tints } from '@/constants/theme';

import { WeeklyLeagueCard } from '../components/WeeklyLeagueCard';
import type { LeagueStandings } from '../types';

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
