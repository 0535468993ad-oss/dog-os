import { supabase, unwrap } from '@/lib/supabase';
import { readFunctionError } from '@/utils/errors';

import type { UserDataByTable } from '../types';

const USER_TABLES = [
  'profiles',
  'dogs',
  'vaccinations',
  'weight_logs',
  'food_portions',
  'medical_notes',
  'training_sessions',
  'user_training_progress',
  'knowledge_bookmarks',
  'journal_entries',
  'chat_history',
  'dog_daily_insights',
  'dog_training_game',
  'user_consents',
  'support_requests',
] as const;

/** Data portability: every row the user owns, per table (RLS scopes each select). */
export async function fetchMyData(): Promise<UserDataByTable> {
  const results = await Promise.all(USER_TABLES.map((table) => supabase.from(table).select('*')));
  const data: UserDataByTable = {};
  USER_TABLES.forEach((table, index) => {
    data[table] = unwrap(results[index]!);
  });
  return data;
}

/** Right to erasure: the Edge Function deletes photos and the auth user (all rows cascade). */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { body: { confirm: 'DELETE' } });
  if (error) {
    const { code } = await readFunctionError(error);
    throw new Error(code);
  }
  // The session is already invalid server-side; clear it locally.
  await supabase.auth.signOut({ scope: 'local' });
}
