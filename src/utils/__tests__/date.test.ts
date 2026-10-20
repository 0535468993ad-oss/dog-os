import { addDays, ageInMonths, computeStreak, daysBetween, formatAge, isValidIsoDate, relativeDay, toIsoDate } from '../date';

describe('toIsoDate / isValidIsoDate', () => {
  it('formats local calendar dates with zero padding', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it.each([
    ['2024-02-29', true],
    ['2023-02-29', false], // not a leap year
    ['2026-13-01', false],
    ['2026-04-31', false],
    ['2026-4-1', false],
    ['not-a-date', false],
  ])('%s -> %s', (value, expected) => {
    expect(isValidIsoDate(value)).toBe(expected);
  });
});

describe('addDays / daysBetween', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts calendar days regardless of DST changes', () => {
    // Israel moves clocks forward in late March; calendar math must not be off by one.
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31);
    expect(daysBetween('2026-10-01', '2026-11-01')).toBe(31);
    expect(daysBetween('2026-05-10', '2026-05-03')).toBe(-7);
  });
});

describe('ageInMonths', () => {
  it('only counts a month once its day is reached', () => {
    expect(ageInMonths('2025-01-15', '2026-01-14')).toBe(11);
    expect(ageInMonths('2025-01-15', '2026-01-15')).toBe(12);
  });

  it('never returns a negative age for a future birth date', () => {
    expect(ageInMonths('2027-01-01', '2026-01-01')).toBe(0);
  });
});

describe('formatAge (Hebrew)', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 18, 12));
  });
  afterEach(() => jest.useRealTimers());

  it.each([
    ['2026-10-01', 'פחות מחודש'],
    ['2026-09-18', 'חודש'],
    ['2026-08-18', 'חודשיים'],
    ['2026-05-18', '5 חודשים'],
    ['2025-10-18', 'שנה'],
    ['2024-09-18', 'שנתיים וחודש'],
    ['2021-10-18', '5 שנים'],
  ])('born %s -> %s', (birth, expected) => {
    expect(formatAge(birth)).toBe(expected);
  });
});

describe('relativeDay', () => {
  it.each([
    ['2026-10-18', 'היום'],
    ['2026-10-19', 'מחר'],
    ['2026-10-17', 'אתמול'],
    ['2026-10-20', 'בעוד יומיים'],
    ['2026-10-25', 'בעוד 7 ימים'],
    ['2026-10-16', 'לפני יומיים'],
    ['2026-10-08', 'לפני 10 ימים'],
  ])('%s -> %s', (date, expected) => {
    expect(relativeDay(date, '2026-10-18')).toBe(expected);
  });
});

describe('computeStreak', () => {
  const today = '2026-10-18';

  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-10-18', '2026-10-17', '2026-10-16'], today)).toBe(3);
  });

  it('keeps a streak alive when today is not done yet', () => {
    expect(computeStreak(['2026-10-17', '2026-10-16'], today)).toBe(2);
  });

  it('stops at the first gap and ignores duplicates', () => {
    expect(computeStreak(['2026-10-18', '2026-10-18', '2026-10-16'], today)).toBe(1);
  });

  it('is zero without activity yesterday or today', () => {
    expect(computeStreak(['2026-10-15'], today)).toBe(0);
    expect(computeStreak([], today)).toBe(0);
  });
});
