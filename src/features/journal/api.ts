import type { JournalCategory, JournalEntryRow, JournalMood } from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';

export interface JournalInput {
  dogId: string;
  note: string;
  category: JournalCategory;
  mood: JournalMood | null;
  entryDate: string;
}

export async function fetchJournal(dogId: string): Promise<JournalEntryRow[]> {
  return unwrap(
    await supabase
      .from('journal_entries')
      .select('*')
      .eq('dog_id', dogId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
  );
}

export async function addJournalEntry(input: JournalInput): Promise<void> {
  unwrap(
    await supabase
      .from('journal_entries')
      .insert({ dog_id: input.dogId, note: input.note, category: input.category, mood: input.mood, entry_date: input.entryDate }),
  );
}

export async function deleteJournalEntry(id: string): Promise<void> {
  unwrap(await supabase.from('journal_entries').delete().eq('id', id));
}
