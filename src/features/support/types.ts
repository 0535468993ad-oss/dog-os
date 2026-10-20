import type { SupportRequestType } from '@/lib/database.types';

/** A validated request, ready to send. */
export interface NewSupportRequest {
  requestType: SupportRequestType;
  subject: string;
  message: string;
  contactEmail: string | null;
}

/** The request form as the user typed it. */
export interface SupportFormValues {
  type: SupportRequestType | null;
  subject: string;
  message: string;
  email: string;
}

/** Hebrew validation messages per field; a missing key means the field is valid. */
export interface SupportFormErrors {
  type?: string;
  subject?: string;
  message?: string;
  email?: string;
}

export type SupportBadgeTone = 'info' | 'warning' | 'success';
