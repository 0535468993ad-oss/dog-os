import { makeFood, makeHealth, makeJournal, makeModule, makeVaccination, makeWeight } from '@/test/fixtures';

import { buildDailyTasks, healthReminders } from '../logic/dailyTasks';
import { isInsight, type Insight } from '../logic/insight';
import { selectInsights } from '../logic/selectInsights';

const TODAY = '2026-10-18';
const ruleInsight: Insight = { kind: 'health', priority: 'normal', title: 'כלל', body: '...' };
const aiInsight: Insight = { kind: 'training', priority: 'normal', title: 'AI', body: '...' };

describe('selectInsights', () => {
  const rules = jest.fn(() => [ruleInsight]);
  beforeEach(() => rules.mockClear());

  it('waits while AI insights load', () => {
    expect(selectInsights({ aiLoading: true, aiSharing: 'allowed', aiInsights: undefined, ruleInsights: rules })).toBeNull();
  });

  it('shows AI insights when sharing is allowed', () => {
    expect(selectInsights({ aiLoading: false, aiSharing: 'allowed', aiInsights: [aiInsight], ruleInsights: rules })).toEqual({ source: 'ai', list: [aiInsight] });
    expect(rules).not.toHaveBeenCalled();
  });

  it('never shows cached AI insights after an opt-out', () => {
    expect(selectInsights({ aiLoading: false, aiSharing: 'opted_out', aiInsights: [aiInsight], ruleInsights: rules })?.source).toBe('rules');
  });

  it('falls back to rules when AI is unavailable', () => {
    expect(selectInsights({ aiLoading: false, aiSharing: 'allowed', aiInsights: null, ruleInsights: rules })).toEqual({ source: 'rules', list: [ruleInsight] });
  });
});

describe('isInsight', () => {
  it('validates the Edge Function shape', () => {
    expect(isInsight(aiInsight)).toBe(true);
    expect(isInsight({ ...aiInsight, kind: 'astrology' })).toBe(false);
    expect(isInsight({ ...aiInsight, priority: 'urgent' })).toBe(false);
    expect(isInsight(null)).toBe(false);
  });
});

describe('buildDailyTasks', () => {
  const base = { today: TODAY, nextModule: null, completedSteps: new Set<string>(), journal: [makeJournal({ entry_date: TODAY })] };

  it('suggests the next unfinished training step', () => {
    const module = makeModule({
      steps: [
        { id: 's1', module_id: 'sit', position: 1, title: 'פיתוי', instructions: '' },
        { id: 's2', module_id: 'sit', position: 2, title: 'סימן יד', instructions: '' },
      ],
    });
    const tasks = buildDailyTasks({ ...base, health: makeHealth({ weights: [makeWeight({ measured_on: TODAY })] }), nextModule: module, completedSteps: new Set(['s1']) });
    expect(tasks[0]).toMatchObject({ id: 'training', detail: 'שלב 2 – סימן יד' });
  });

  it('lists meals, due vaccinations (urgent when overdue) and a missing journal entry', () => {
    const health = makeHealth({
      food: [makeFood()],
      vaccinations: [makeVaccination({ id: 'late', due_date: '2026-10-01' }), makeVaccination({ id: 'later', due_date: '2027-01-01' })],
      weights: [makeWeight({ measured_on: '2026-10-10' })],
    });
    const tasks = buildDailyTasks({ ...base, health, journal: [] });
    expect(tasks.map((t) => t.id)).toEqual(['food-f-1', 'vac-late', 'journal']);
    expect(tasks.find((t) => t.id === 'vac-late')?.urgent).toBe(true);
  });

  it('asks for a weigh-in when the last one is over 30 days old', () => {
    const tasks = buildDailyTasks({ ...base, health: makeHealth({ weights: [makeWeight({ measured_on: '2026-09-01' })] }) });
    expect(tasks.map((t) => t.id)).toContain('weigh');
  });
});

describe('healthReminders', () => {
  it('includes vaccinations due within 30 days, and overdue ones', () => {
    const health = makeHealth({
      vaccinations: [
        makeVaccination({ id: 'overdue', due_date: '2026-10-01' }),
        makeVaccination({ id: 'soon', due_date: '2026-11-10' }),
        makeVaccination({ id: 'far', due_date: '2027-03-01' }),
        makeVaccination({ id: 'none', due_date: null }),
      ],
    });
    expect(healthReminders(health, TODAY).map((v) => v.id)).toEqual(['overdue', 'soon']);
  });
});
