import type { UserConsentRow } from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';

import type { NewConsentRow } from '../types';

/** The signed-in user's consent records, newest first (RLS scopes the select). */
export async function fetchConsents(): Promise<UserConsentRow[]> {
  return unwrap(await supabase.from('user_consents').select('*').order('created_at', { ascending: false }));
}

/** Appends consent decisions; records are never updated, so the history stays auditable. */
export async function insertConsents(rows: NewConsentRow[]): Promise<void> {
  unwrap(await supabase.from('user_consents').insert(rows));
}
