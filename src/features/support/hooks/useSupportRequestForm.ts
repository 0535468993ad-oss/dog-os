import { useState } from 'react';

import type { Feedback } from '@/components/ui';
import type { SupportRequestType } from '@/lib/database.types';

import type { SupportFormErrors, SupportFormValues } from '../types';
import { SUBMIT_SUCCESS_TEXT, submitErrorText, validateSupportRequest } from '../utils/validateRequest';
import { useCreateSupportRequest } from './useSupportRequests';

const EMPTY_TEXT = { subject: '', message: '', email: '' };

/** Form state for a new support request: values, validation, submission and feedback. */
export function useSupportRequestForm(initialType?: SupportRequestType) {
  const create = useCreateSupportRequest();
  const [values, setValues] = useState<SupportFormValues>({ type: initialType ?? null, ...EMPTY_TEXT });
  const [errors, setErrors] = useState<SupportFormErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  /** Updates one field. */
  const setField = <K extends keyof SupportFormValues>(key: K, value: SupportFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  /** Validates, sends, and clears the text fields on success (the chosen type stays). */
  const submit = async () => {
    const { input, errors: next } = validateSupportRequest(values);
    setErrors(next);
    if (!input) return;

    setFeedback(null);
    try {
      await create.mutateAsync(input);
      setValues((current) => ({ ...current, ...EMPTY_TEXT }));
      setFeedback({ kind: 'success', text: SUBMIT_SUCCESS_TEXT });
    } catch (error) {
      setFeedback({ kind: 'error', text: submitErrorText(error) });
    }
  };

  return { values, errors, feedback, setField, submit, submitting: create.isPending };
}
