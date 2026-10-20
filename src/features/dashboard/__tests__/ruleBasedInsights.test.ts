import { makeDog, makeHealth, makeJournal, makeModule, makeVaccination, makeWeight } from '@/test/fixtures';

import { ruleBasedInsights } from '../logic/ruleBasedInsights';

const base = {
  dog: makeDog({ birth_date: '2022-05-10' }),
  health: makeHealth({ vaccinations: [makeVaccination({ due_date: '2027-05-01' })], weights: [makeWeight({ measured_on: '2026-10-10' })] }),
  streak: 0,
  activeModule: null,
  nextModule: makeModule(),
  journal: [],
  breedArticles: [],
};

describe('ruleBasedInsights', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 18, 12));
  });
  afterEach(() => jest.useRealTimers());

  it('always returns one health, one training and one behavior/nutrition insight', () => {
    const insights = ruleBasedInsights(base);
    expect(insights).toHaveLength(3);
    expect(insights[0]?.kind).toBe('health');
    expect(insights[1]?.kind).toBe('training');
    expect(['behavior', 'nutrition']).toContain(insights[2]?.kind);
  });

  it('flags an overdue vaccination as high priority', () => {
    const insights = ruleBasedInsights({ ...base, health: makeHealth({ vaccinations: [makeVaccination({ name: 'כלבת', due_date: '2026-09-01' })] }) });
    expect(insights[0]).toMatchObject({ priority: 'high', title: 'חיסון באיחור' });
    expect(insights[0]?.body).toContain('כלבת');
  });

  it('asks to record vaccinations when there are none', () => {
    expect(ruleBasedInsights({ ...base, health: makeHealth() })[0]?.title).toBe('תעדו את פנקס החיסונים');
  });

  it('continues the active module, celebrating a streak', () => {
    const insights = ruleBasedInsights({ ...base, activeModule: makeModule({ title: 'השארות' }), streak: 4 });
    expect(insights[1]?.title).toBe('רצף של 4 ימים!');
    expect(insights[1]?.body).toContain('השארות');
  });

  it('notices a run of hard days in the journal', () => {
    const journal = [makeJournal({ id: 'a', mood: 'bad', entry_date: '2026-10-17' }), makeJournal({ id: 'b', mood: 'bad', entry_date: '2026-10-15' })];
    expect(ruleBasedInsights({ ...base, journal })[2]?.title).toBe('שבוע מאתגר');
  });

  it('targets socialization for young puppies', () => {
    expect(ruleBasedInsights({ ...base, dog: makeDog({ birth_date: '2026-08-20' }) })[2]?.title).toBe('חלון הסוציאליזציה');
  });
});
