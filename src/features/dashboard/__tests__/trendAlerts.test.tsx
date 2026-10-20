import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { makeVaccination } from '@/test/fixtures';

import { TrendsAlertCard } from '../components/TrendsAlertCard';
import { taskSummary } from '../logic/dailyTasks';
import { buildTrendAlerts } from '../logic/trendAlerts';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

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
