// Journal contracts: the entry input and the stored row types it pages through.
import type { JournalCategory, JournalEntryRow, JournalMood } from '@/lib/database.types';

export type { JournalCategory, JournalEntryRow, JournalMood };

export interface JournalInput {
  dogId: string;
  note: string;
  category: JournalCategory;
  mood: JournalMood | null;
  entryDate: string;
}
