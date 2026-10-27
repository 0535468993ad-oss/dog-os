import type { JournalEntryRow } from '../types';

// Server-side paging for the journal list: small pages, the next offset from what is loaded, and a flat list
// with one copy per entry (an insert from another device between two page fetches shifts the offsets).

/** Entries per page of the journal list. */
export const JOURNAL_PAGE_SIZE = 15;

/** Newest entries the dashboard and the advisor context need (the advisor shows 7; insights look back 7 days). */
export const RECENT_JOURNAL_LIMIT = 20;

/** Newest entries the vet report includes (buildReport keeps the latest 30). */
export const REPORT_JOURNAL_LIMIT = 30;

/** The offset of the next page, or undefined when the last page came back short (nothing more to load). */
export function nextJournalOffset(pages: readonly (readonly JournalEntryRow[])[]): number | undefined {
  const last = pages.at(-1);
  if (!last || last.length < JOURNAL_PAGE_SIZE) return undefined;
  return pages.reduce((total, page) => total + page.length, 0);
}

/** All loaded pages as one list, keeping the first copy of an entry that appears on two pages. */
export function flattenJournalPages(pages: readonly (readonly JournalEntryRow[])[]): JournalEntryRow[] {
  const seen = new Set<string>();
  const entries: JournalEntryRow[] = [];
  for (const page of pages) {
    for (const entry of page) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      entries.push(entry);
    }
  }
  return entries;
}
