import type { UserDataByTable, UserDataExport } from '../types';

const PHOTOS_NOTE = 'תמונות הכלב נשמרות בנפרד ואינן כלולות בקובץ זה.';

/** The export file's content: a timestamp, the account email and all table data. */
export function buildExportPayload(data: UserDataByTable, email: string | undefined, exportedAt: Date): UserDataExport {
  return { exported_at: exportedAt.toISOString(), account: { email }, note: PHOTOS_NOTE, data };
}

/** Download name for an export made on `isoDate` (YYYY-MM-DD). */
export function exportFileName(isoDate: string): string {
  return `dog-os-data-${isoDate}.json`;
}
