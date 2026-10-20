import { toUserMessage } from '@/utils/errors';

import type { NewSupportRequest, SupportFormErrors, SupportFormValues } from '../types';
import { SupportRateLimitError } from './rateLimitError';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SUBMIT_SUCCESS_TEXT = 'הפנייה התקבלה. נשיב לאימייל שלכם, ובפניות פרטיות – תוך 30 יום לכל היותר.';

/** Validates the form; returns the trimmed request when valid, otherwise per-field Hebrew errors. */
export function validateSupportRequest(values: SupportFormValues): { input: NewSupportRequest | null; errors: SupportFormErrors } {
  const subject = values.subject.trim();
  const message = values.message.trim();
  const email = values.email.trim();

  const errors: SupportFormErrors = {};
  if (!values.type) errors.type = 'בחרו את סוג הפנייה.';
  if (subject.length < 2) errors.subject = 'הזינו נושא קצר.';
  if (message.length < 10) errors.message = 'פרטו את הפנייה (10 תווים לפחות).';
  if (email && !EMAIL_PATTERN.test(email)) errors.email = 'כתובת האימייל אינה תקינה.';

  if (Object.keys(errors).length > 0 || !values.type) return { input: null, errors };
  return { input: { requestType: values.type, subject, message, contactEmail: email || null }, errors };
}

/** User-facing text for a failed submission. */
export function submitErrorText(error: unknown): string {
  return error instanceof SupportRateLimitError ? 'שלחתם כבר כמה פניות היום. נסו שוב מחר או כתבו לנו באימייל.' : toUserMessage(error, 'שליחת הפנייה נכשלה. נסו שוב.');
}
