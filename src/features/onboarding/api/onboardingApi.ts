import { supabase, unwrap } from '@/lib/supabase';

/** Marks the owner's first-run onboarding as done (finished or skipped). RLS limits it to their own row. */
export async function setOnboardingCompleted(userId: string): Promise<void> {
  unwrap(await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId));
}
