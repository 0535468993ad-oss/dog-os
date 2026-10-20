// Dates are stored as ISO calendar dates (YYYY-MM-DD) and timestamps (ISO 8601). All display is Hebrew.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Local midnight for an ISO calendar date. */
export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  return toIsoDate(parseIsoDate(value)) === value;
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseIsoDate(toIso).getTime() - parseIsoDate(fromIso).getTime()) / 86_400_000);
}

export function ageInMonths(birthDate: string, today = todayIso()): number {
  const birth = parseIsoDate(birthDate);
  const now = parseIsoDate(today);
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

function hebrewMonths(n: number): string {
  if (n === 1) return 'חודש';
  if (n === 2) return 'חודשיים';
  return `${n} חודשים`;
}

function hebrewYears(n: number): string {
  if (n === 1) return 'שנה';
  if (n === 2) return 'שנתיים';
  return `${n} שנים`;
}

export function formatAge(birthDate: string): string {
  const months = ageInMonths(birthDate);
  if (months < 1) return 'פחות מחודש';
  if (months < 12) return hebrewMonths(months);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${hebrewYears(years)} ו${hebrewMonths(rest)}` : hebrewYears(years);
}

const dateFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDateFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' });
const timeFormatter = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' });

export function formatDate(isoDate: string): string {
  return dateFormatter.format(parseIsoDate(isoDate));
}

export function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(parseIsoDate(isoDate));
}

export function formatTime(timestamp: string): string {
  return timeFormatter.format(new Date(timestamp));
}

/** "היום", "מחר", "בעוד 5 ימים", "לפני 3 ימים" */
export function relativeDay(isoDate: string, today = todayIso()): string {
  const diff = daysBetween(today, isoDate);
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  if (diff === -1) return 'אתמול';
  if (diff > 1) return diff === 2 ? 'בעוד יומיים' : `בעוד ${diff} ימים`;
  return diff === -2 ? 'לפני יומיים' : `לפני ${-diff} ימים`;
}

/** Consecutive days ending today (or yesterday, so an unfinished today doesn't break it). */
export function computeStreak(activeDays: Iterable<string>, today = todayIso()): number {
  const days = new Set(activeDays);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
