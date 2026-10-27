import { supabase, unwrap } from '@/lib/supabase';

import type { JournalEntryRow, JournalInput } from '../types';

/** A dog's entries, newest first, as one query to page or limit (served by journal_entries_dog_date_idx). */
function newestFirst(dogId: string) {
  return supabase.from('journal_entries').select('*').eq('dog_id', dogId).order('entry_date', { ascending: false }).order('created_at', { ascending: false });
}

/** One page of the journal list: `limit` entries from `offset`, newest first. */
export async function fetchJournalPage(dogId: string, offset: number, limit: number): Promise<JournalEntryRow[]> {
  return unwrap(await newestFirst(dogId).range(offset, offset + limit - 1));
}

/** The newest entries only, for the dashboard, the advisor context and the vet report. */
export async function fetchRecentJournal(dogId: string, limit: number): Promise<JournalEntryRow[]> {
  return unwrap(await newestFirst(dogId).limit(limit));
}

/** Adds an entry for a dog. */
export async function addJournalEntry(input: JournalInput): Promise<void> {
  unwrap(
    await supabase
      .from('journal_entries')
      .insert({ dog_id: input.dogId, note: input.note, category: input.category, mood: input.mood, entry_date: input.entryDate }),
  );
}

/** Deletes one entry. */
export async function deleteJournalEntry(id: string): Promise<void> {
  unwrap(await supabase.from('journal_entries').delete().eq('id', id));
}
