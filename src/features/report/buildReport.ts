import { SIZE_SHORT_LABELS } from '@/features/dogs/breeds';
import type { HealthData } from '@/features/health/api';
import type { ModuleProgress, TrainingModule } from '@/features/training/types';
import { JOURNAL_CATEGORY_LABELS, MOOD_LABELS } from '@/features/journal/data/labels';
import type { DogRow, JournalEntryRow } from '@/lib/database.types';
import { colors } from '@/constants/theme';
import { formatAge, formatDate, todayIso } from '@/utils/date';

export interface ReportData {
  dog: DogRow;
  health: HealthData;
  modules: TrainingModule[];
  perModule: Map<string, ModuleProgress>;
  streak: number;
  journal: JournalEntryRow[];
}

/**
 * Defense in depth: on web the report opens in a same-origin window (where the session lives in
 * localStorage), so even if a value ever escaped `escape`, no script, network request or form could run.
 */
export const REPORT_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'";

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const date = (iso: string | null) => (iso ? formatDate(iso) : '—');

function table(headers: string[], rows: string[][]): string {
  if (!rows.length) return '<p class="muted">אין רשומות.</p>';
  return `<table><thead><tr>${headers.map((h) => `<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${escape(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

/** Self-contained, printable RTL HTML summary for a veterinarian or trainer. All user text is escaped. */
export function buildReportHtml({ dog, health, modules, perModule, streak, journal }: ReportData): string {
  const weights = [...health.weights].reverse().slice(0, 12);
  const started = modules.filter((m) => (perModule.get(m.id)?.completed ?? 0) > 0);
  const recentJournal = journal.slice(0, 30);

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${REPORT_CSP}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(`סיכום בריאות והתנהגות – ${dog.name}`)}</title>
<style>
  body { font-family: Heebo, Arial, sans-serif; color: ${colors.textPrimary}; margin: 32px; line-height: 1.5; }
  h1 { color: ${colors.primary}; margin: 0 0 4px; font-size: 24px; }
  h2 { font-size: 17px; border-bottom: 2px solid ${colors.border}; padding-bottom: 4px; margin-top: 28px; }
  .muted { color: ${colors.textSecondary}; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid ${colors.border}; padding: 6px 8px; text-align: start; vertical-align: top; }
  th { background: ${colors.surfaceAlt}; }
  .note { font-size: 12px; color: ${colors.textSecondary}; margin-top: 32px; border-top: 1px solid ${colors.border}; padding-top: 8px; }
  @media print { body { margin: 12mm; } h2 { break-after: avoid; } tr { break-inside: avoid; } }
</style>
</head>
<body>
<header>
  <h1>${escape(`סיכום בריאות והתנהגות – ${dog.name}`)}</h1>
  <p class="muted">${escape(`הופק מ-Dog OS בתאריך ${formatDate(todayIso())}`)}</p>
</header>

<h2>פרטי הכלב</h2>
<div class="grid">
  <div><strong>שם:</strong> ${escape(dog.name)}</div>
  <div><strong>גזע:</strong> ${escape(dog.breed)}</div>
  <div><strong>תאריך לידה:</strong> ${escape(`${date(dog.birth_date)} (${formatAge(dog.birth_date)})`)}</div>
  <div><strong>גודל:</strong> ${escape(SIZE_SHORT_LABELS[dog.size])}</div>
  <div><strong>משקל נוכחי:</strong> ${escape(dog.weight_kg != null ? `${dog.weight_kg} ק״ג` : '—')}</div>
</div>

<h2>חיסונים</h2>
${table(['חיסון', 'ניתן לאחרונה', 'מועד הבא', 'הערות'], health.vaccinations.map((v) => [v.name, date(v.last_given), date(v.due_date), v.notes ?? '']))}

<h2>מעקב משקל</h2>
${table(['תאריך', 'משקל (ק״ג)'], weights.map((w) => [date(w.measured_on), String(w.weight_kg)]))}

<h2>תזונה</h2>
${table(['מזון', 'ארוחות ביום', 'גרם לארוחה', 'קק״ל ל-100 גרם'], health.food.map((f) => [f.food_name, String(f.meals_per_day), String(f.grams_per_meal), f.kcal_per_100g != null ? String(f.kcal_per_100g) : '—']))}

<h2>הערות רפואיות</h2>
${table(['תאריך', 'כותרת', 'פירוט'], health.notes.map((n) => [date(n.noted_on), n.title, n.body]))}

<h2>אימונים</h2>
<p>${escape(`רצף אימונים נוכחי: ${streak} ימים.`)}</p>
${table(['מודול', 'התקדמות'], started.map((m) => {
    const p = perModule.get(m.id);
    return [m.title, p ? `${p.completed}/${p.total} שלבים` : '—'];
  }))}

<h2>יומן התנהגות (30 רשומות אחרונות)</h2>
${table(['תאריך', 'קטגוריה', 'מצב', 'רשומה'], recentJournal.map((j) => [date(j.entry_date), JOURNAL_CATEGORY_LABELS[j.category], j.mood ? MOOD_LABELS[j.mood] : '', j.note]))}

<p class="note">המסמך מבוסס על מידע שהזינו הבעלים ב-Dog OS ואינו מסמך רפואי רשמי.</p>
</body>
</html>`;
}
