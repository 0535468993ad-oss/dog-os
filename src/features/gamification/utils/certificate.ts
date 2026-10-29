// The printable diploma for the level 5 and level 10 rewards. Pure: builds escaped HTML that the
// export helper prints to PDF or opens in the browser's print dialog.
import { colors } from '@/constants/theme';

export type CertificateKind = 'FOUNDATION' | 'GRANDMASTER';

export interface CertificateData {
  kind: CertificateKind;
  dogName: string;
  breed: string | null;
  /** YYYY-MM-DD */
  completedOn: string;
  rankTitleHe: string;
}

const TITLES: Readonly<Record<CertificateKind, string>> = {
  FOUNDATION: 'תעודת יסודות',
  GRANDMASTER: 'תעודת גראנד־מאסטר',
};

const BODIES: Readonly<Record<CertificateKind, string>> = {
  FOUNDATION: 'השלים/ה בהצלחה את שלב היסודות בתוכנית האילוף של Dog OS – תרגול עקבי, בבית ובחוץ.',
  GRANDMASTER: 'הגיע/ה לדרגה העליונה בתוכנית האילוף של Dog OS – חודש ויותר של תרגול, בכל סביבה ובכל תנאי.',
};

/** Escapes text for HTML (dog names are user input). */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** "22.10.2026" from "2026-10-22". */
export function hebrewDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}.${month}.${year}` : iso;
}

/** The certificate's title, for the preview and the share dialog. */
export const certificateTitle = (kind: CertificateKind): string => TITLES[kind];

/** A self-contained A4-landscape RTL page. */
export function buildCertificateHtml({ kind, dogName, breed, completedOn, rankTitleHe }: CertificateData): string {
  const name = escapeHtml(dogName);
  const breedLine = breed ? `<p class="breed">${escapeHtml(breed)}</p>` : '';
  return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><title>${TITLES[kind]} – ${name}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  body { margin: 0; font-family: Heebo, Arial, sans-serif; background: ${colors.background}; color: ${colors.textPrimary}; }
  .frame { box-sizing: border-box; height: 100vh; margin: 0; padding: 48px; border: 10px solid ${colors.primary}; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 12px; }
  h1 { margin: 0; font-size: 44px; color: ${colors.primaryBright}; }
  .dog { font-size: 56px; font-weight: 800; margin: 16px 0 0; }
  .breed { font-size: 22px; color: ${colors.textSecondary}; margin: 0; }
  .body { font-size: 22px; max-width: 760px; line-height: 1.6; }
  .meta { font-size: 18px; color: ${colors.healthText}; }
</style></head>
<body><div class="frame">
  <h1>${TITLES[kind]}</h1>
  <p class="dog">${name}</p>
  ${breedLine}
  <p class="body">${BODIES[kind]}</p>
  <p class="meta">דרגה: ${escapeHtml(rankTitleHe)} · ${hebrewDate(completedOn)}</p>
  <p class="meta">Dog OS</p>
</div></body></html>`;
}
