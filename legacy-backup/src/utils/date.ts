const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// A real calendar date in YYYY-MM-DD form that isn't in the future (rejects e.g. 2024-02-30).
export function isValidPastIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= new Date();
}

export function formatAge(birthDate: string): string {
  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 1) return 'Under 1 month';
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  return `${years} yr`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
