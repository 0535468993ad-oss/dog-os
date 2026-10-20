import type { SupportRequestRow } from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';

import type { NewSupportRequest } from '../types';
import { SupportRateLimitError } from '../utils/rateLimitError';

/** The user's latest 50 requests, newest first (RLS scopes the select). */
export async function fetchSupportRequests(): Promise<SupportRequestRow[]> {
  return unwrap(await supabase.from('support_requests').select('*').order('created_at', { ascending: false }).limit(50));
}

/** Stores a request; throws SupportRateLimitError when the daily limit is reached. */
export async function createSupportRequest(input: NewSupportRequest): Promise<void> {
  const { error } = await supabase.from('support_requests').insert({
    request_type: input.requestType,
    subject: input.subject,
    message: input.message,
    contact_email: input.contactEmail,
  });
  if (error?.hint === 'rate_limited') throw new SupportRateLimitError();
  if (error) throw error;
}
