import type { SupportRequestRow, SupportRequestStatus, SupportRequestType } from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';

export const REQUEST_TYPE_LABELS: Record<SupportRequestType, string> = {
  privacy_access: 'עיון במידע שלי',
  privacy_correction: 'תיקון מידע',
  privacy_deletion: 'מחיקת מידע',
  privacy_objection: 'התנגדות לעיבוד',
  accessibility: 'בעיית נגישות',
  general: 'פנייה כללית',
};

export const REQUEST_STATUS_LABELS: Record<SupportRequestStatus, string> = {
  open: 'התקבלה',
  in_progress: 'בטיפול',
  closed: 'טופלה',
};

export function isSupportRequestType(value: unknown): value is SupportRequestType {
  // Own keys only: `in` would also accept inherited names such as "constructor".
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(REQUEST_TYPE_LABELS, value);
}

export interface NewSupportRequest {
  requestType: SupportRequestType;
  subject: string;
  message: string;
  contactEmail: string | null;
}

export async function fetchSupportRequests(): Promise<SupportRequestRow[]> {
  return unwrap(await supabase.from('support_requests').select('*').order('created_at', { ascending: false }).limit(50));
}

export class SupportRateLimitError extends Error {}

export async function createSupportRequest(input: NewSupportRequest): Promise<void> {
  const { error } = await supabase.from('support_requests').insert({
    request_type: input.requestType,
    subject: input.subject,
    message: input.message,
    contact_email: input.contactEmail,
  });
  // Raised by the limit_support_requests trigger.
  if (error?.hint === 'rate_limited') throw new SupportRateLimitError();
  if (error) throw error;
}
