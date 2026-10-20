import { exportJsonFile } from '@/features/report/exportFiles';
import { supabase, unwrap } from '@/lib/supabase';
import { todayIso } from '@/utils/date';
import { readFunctionError } from '@/utils/errors';

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
  'user_consents',
  'support_requests',
] as const;

/** Data portability: every row the user owns (RLS scopes each select), as one JSON file. */
export async function exportMyData(email: string | undefined): Promise<void> {
  const results = await Promise.all(USER_TABLES.map((table) => supabase.from(table).select('*')));
  const data: Record<string, unknown> = {};
  USER_TABLES.forEach((table, index) => {
    data[table] = unwrap(results[index]!);
  });
  const payload = {
    exported_at: new Date().toISOString(),
    account: { email },
    note: 'תמונות הכלב נשמרות בנפרד ואינן כלולות בקובץ זה.',
    data,
  };
  await exportJsonFile(JSON.stringify(payload, null, 2), `dog-os-data-${todayIso()}.json`);
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
