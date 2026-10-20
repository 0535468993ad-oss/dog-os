import { vaccinationStatus } from '@/features/health/logic/vaccinationStatus';
import type { VaccinationRow } from '@/lib/database.types';

/** `alert` = a hazard to act on (coral); `health` = care guidance or a routine vet reminder (emerald). */
export type TrendTone = 'alert' | 'health';
export type TrendKind = 'ticks' | 'heat' | 'caterpillars' | 'cold' | 'vaccination';

export interface TrendAlert {
  id: string;
  kind: TrendKind;
  tone: TrendTone;
  badge: string;
  title: string;
  body: string;
  /** Vet reminders open the Health tab; seasonal alerts are informational. */
  opensHealth: boolean;
}

interface SeasonalRule {
  kind: Exclude<TrendKind, 'vaccination'>;
  tone: TrendTone;
  /** Calendar months (1–12) the alert is active in. Seasons are for Israel (northern hemisphere). */
  months: readonly number[];
  title: string;
  body: string;
}

const SEASONAL_BADGE = 'התראה עונתית';
const VET_BADGE = 'תזכורת וטרינר';

const SEASONAL_RULES: readonly SeasonalRule[] = [
  {
    kind: 'caterpillars',
    tone: 'alert',
    months: [1, 2, 3, 4],
    title: 'עונת זחלי התהלוכה',
    body: 'הזחלים שעל עצי האורן מסוכנים מאוד במגע עם הלשון והפה. הרחיקו את הכלב מאורנים ומשורות זחלים; במקרה של מגע – שטפו במים והגיעו לווטרינר מיד.',
  },
  {
    kind: 'ticks',
    tone: 'alert',
    months: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    title: 'עונת קרציות',
    body: 'בדקו את הפרווה אחרי כל טיול – במיוחד באוזניים, בין האצבעות ובבתי השחי – וודאו שהטיפול נגד קרציות בתוקף.',
  },
  {
    kind: 'heat',
    tone: 'alert',
    months: [6, 7, 8, 9],
    title: 'עומס חום',
    body: 'טיילו בבוקר המוקדם או בערב והקפידו על מים זמינים. בדקו את האספלט בגב כף היד: אם הוא חם מדי לכם, הוא חם מדי לכפות.',
  },
  {
    kind: 'cold',
    tone: 'health',
    months: [12, 1, 2],
    title: 'שמירה על חום בחורף',
    body: 'כלבים קטנים, מבוגרים וקצרי פרווה רגישים לקור. שקלו מעיל לטיולים ודאגו למקום שינה חם ויבש.',
  },
];

/** Month (1–12) of an ISO `YYYY-MM-DD` date, read from the string so no time zone can shift it. */
function monthOf(isoDate: string): number {
  return Number(isoDate.slice(5, 7));
}

/**
 * Health & trends alerts for the dashboard: vet reminders for vaccinations that are overdue or due soon,
 * then the seasonal hazards active this month. Hazards to act on come before routine guidance.
 */
export function buildTrendAlerts(today: string, dueVaccinations: readonly VaccinationRow[]): TrendAlert[] {
  const vet = dueVaccinations.map((v): TrendAlert => {
    const status = vaccinationStatus(v, today);
    return {
      id: `vaccination-${v.id}`,
      kind: 'vaccination',
      tone: status.tone === 'danger' ? 'alert' : 'health',
      badge: VET_BADGE,
      title: v.name,
      body: status.label,
      opensHealth: true,
    };
  });
  const month = monthOf(today);
  const seasonal = SEASONAL_RULES.filter((rule) => rule.months.includes(month)).map(
    (rule): TrendAlert => ({ id: `season-${rule.kind}`, kind: rule.kind, tone: rule.tone, badge: SEASONAL_BADGE, title: rule.title, body: rule.body, opensHealth: false }),
  );
  const all = [...vet, ...seasonal];
  return [...all.filter((a) => a.tone === 'alert'), ...all.filter((a) => a.tone === 'health')];
}
