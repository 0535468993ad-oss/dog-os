// Home cards: trend alerts (logic and card), the compact quick-access tiles and the hero without its corner glow.
import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { colors } from '@/constants/theme';
import { makeDog, makeVaccination } from '@/test/fixtures';

import { DogHeroCard } from '../components/DogHeroCard';
import { QuickActions } from '../components/QuickActions';
import { TrendsAlertCard } from '../components/TrendsAlertCard';
import { taskSummary } from '../logic/dailyTasks';
import { buildTrendAlerts } from '../logic/trendAlerts';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/dogs/components', () => ({ DogSwitcher: () => null }));

const flat = (element: { props: { style?: unknown } }) => StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

const push = router.push as jest.Mock;

describe('buildTrendAlerts', () => {
  it('shows tick season in October and nothing hot or wintry', () => {
    expect(buildTrendAlerts('2026-10-19', []).map((a) => a.kind)).toEqual(['ticks']);
  });

  it('stacks overlapping summer hazards', () => {
    expect(buildTrendAlerts('2026-07-01', []).map((a) => a.kind)).toEqual(['ticks', 'heat']);
  });

  it('warns about processionary caterpillars in early spring', () => {
    expect(buildTrendAlerts('2026-03-10', []).map((a) => a.kind)).toEqual(['caterpillars', 'ticks']);
  });

  it('puts hazards before routine winter guidance', () => {
    const alerts = buildTrendAlerts('2026-01-15', []);
    expect(alerts.map((a) => [a.kind, a.tone])).toEqual([
      ['caterpillars', 'alert'],
      ['cold', 'health'],
    ]);
  });

  it('turns due vaccinations into vet reminders: overdue as alerts, upcoming as health', () => {
    const overdue = makeVaccination({ id: 'v1', name: 'כלבת', due_date: '2026-10-01' });
    const upcoming = makeVaccination({ id: 'v2', name: 'משושה', due_date: '2026-11-01' });
    const alerts = buildTrendAlerts('2026-10-19', [upcoming, overdue]);

    expect(alerts.map((a) => a.id)).toEqual(['vaccination-v1', 'season-ticks', 'vaccination-v2']);
    expect(alerts[0]).toMatchObject({ tone: 'alert', badge: 'תזכורת וטרינר', title: 'כלבת', opensHealth: true });
    expect(alerts[2]).toMatchObject({ tone: 'health', title: 'משושה' });
  });

  it('marks a vaccination due soon as a health reminder', () => {
    const soon = makeVaccination({ id: 'v3', due_date: '2026-12-20' });
    expect(buildTrendAlerts('2026-12-10', [soon])[0]).toMatchObject({ id: 'vaccination-v3', tone: 'health' });
  });
});

describe('taskSummary', () => {
  it('pluralizes in Hebrew', () => {
    expect(taskSummary(0)).toBe('אין משימות פתוחות להיום');
    expect(taskSummary(1)).toBe('משימה אחת להיום');
    expect(taskSummary(3)).toBe('3 משימות להיום');
  });
});

describe('TrendsAlertCard', () => {
  beforeEach(() => push.mockClear());

  it('renders seasonal alerts as single labelled elements and vet reminders as buttons', async () => {
    const vaccination = makeVaccination({ id: 'v1', name: 'כלבת', due_date: '2026-10-01' });
    await render(<TrendsAlertCard alerts={buildTrendAlerts('2026-10-19', [vaccination])} />);

    expect(screen.getByRole('header', { name: 'בריאות ומגמות' })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^התראה עונתית: עונת קרציות\./)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /עונת קרציות/ })).toBeNull();

    await userEvent.press(screen.getByRole('button', { name: /^תזכורת וטרינר: כלבת\./ }));
    expect(push).toHaveBeenCalledWith('/health');
  });
});

describe('TrendsAlertCard layout', () => {
  it('puts dark text on the vivid badge fill', async () => {
    await render(<TrendsAlertCard alerts={buildTrendAlerts('2026-10-19', [])} />);
    expect(flat(screen.getByText('התראה עונתית')).color).toBe(colors.onAccent);
  });
});

describe('QuickActions', () => {
  beforeEach(() => push.mockClear());

  it('renders compact row tiles (icon beside label) that still meet the touch target', async () => {
    await render(<QuickActions />);
    const tile = flat(screen.getByRole('button', { name: 'יומן' }));
    expect(tile).toMatchObject({ flexDirection: 'row', alignItems: 'center' });
    expect(Number(tile.minHeight)).toBeGreaterThanOrEqual(44);

    await userEvent.press(screen.getByRole('button', { name: 'דוח לווטרינר' }));
    expect(push).toHaveBeenCalledWith('/report');
  });
});

/** Mounts the hero with a real shared value, as the dashboard does. */
function HeroHarness() {
  const scrollY = useSharedValue(0);
  const dog = makeDog({ name: 'ג׳קסון' });
  return <DogHeroCard dogs={[dog]} dog={dog} scrollY={scrollY} taskCount={2} />;
}

describe('DogHeroCard', () => {
  it('drops the corner glow for a hairline amber edge', async () => {
    await render(<HeroHarness />);
    // Label → "today" pill → card.
    const card = screen.getByText('2 משימות להיום').parent?.parent;
    expect(card && flat(card)).toMatchObject({ borderWidth: 1, borderColor: colors.primaryMuted });
    const children = card?.children ?? [];
    for (const child of children) {
      if (typeof child !== 'string') expect(flat(child).position).not.toBe('absolute');
    }
  });
});

