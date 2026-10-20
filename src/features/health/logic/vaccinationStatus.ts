import type { VaccinationRow } from '@/lib/database.types';
import { daysBetween, formatDate, relativeDay, todayIso } from '@/utils/date';

export type VaccinationTone = 'danger' | 'warning' | 'success' | 'neutral';

/** Hebrew status label and badge tone for a vaccination: overdue, due within 30 days, or scheduled. */
export function vaccinationStatus(v: VaccinationRow, today = todayIso()): { label: string; tone: VaccinationTone } {
  if (!v.due_date) return { label: 'ללא מועד הבא', tone: 'neutral' };
  const days = daysBetween(today, v.due_date);
  if (days < 0) return { label: `באיחור (${relativeDay(v.due_date, today)})`, tone: 'danger' };
  if (days <= 30) return { label: `בקרוב (${relativeDay(v.due_date, today)})`, tone: 'warning' };
  return { label: `הבא: ${formatDate(v.due_date)}`, tone: 'success' };
}
