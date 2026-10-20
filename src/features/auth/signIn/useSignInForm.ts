import { useState } from 'react';

import type { Feedback } from '@/components/ui';
import { NETWORK_ERROR } from '@/utils/errors';

import { requestPasswordReset, resendConfirmation, signIn, signUp } from '../api';
import { validateSignIn, type AuthMode, type SignInErrors } from './signInLogic';

const RESET_SENT = 'אם קיים חשבון עם הכתובת הזו, שלחנו אליה קישור לבחירת סיסמה חדשה. בדקו גם בתיקיית הספאם.';
const CONFIRMATION_SENT = 'שלחנו לכם מייל לאישור החשבון. אחרי האישור – התחברו כאן.';
const CONFIRMATION_RESENT = 'שלחנו שוב את מייל האישור. בדקו גם בתיקיית הספאם.';

/** State and actions of the sign-in / sign-up / password-reset screen. */
export function useSignInForm() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [aiAccepted, setAiAccepted] = useState(false);
  const [errors, setErrors] = useState<SignInErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [canResend, setCanResend] = useState(false);

  // Changes mode and clears everything mode-specific (the email is kept).
  const switchMode = (next: AuthMode) => {
    setMode(next);
    setPassword('');
    setErrors({});
    setFeedback(null);
    setCanResend(false);
  };

  // Runs one auth request with the busy flag; a thrown (network) error becomes a message.
  const run = async (action: () => Promise<void>) => {
    setSubmitting(true);
    try {
      await action();
    } catch {
      setFeedback({ kind: 'error', text: NETWORK_ERROR });
    } finally {
      setSubmitting(false);
    }
  };

  // Validates for the current mode, then signs in, signs up or requests a reset link.
  const submit = async () => {
    if (submitting) return;
    const next = validateSignIn(mode, { email, password, termsAccepted, aiAccepted });
    setErrors(next);
    if (Object.keys(next).length) return;
    setFeedback(null);
    setCanResend(false);
    await run(async () => {
      if (mode === 'reset') {
        const result = await requestPasswordReset(email);
        setFeedback(result.ok ? { kind: 'info', text: RESET_SENT } : { kind: 'error', text: result.message });
      } else if (mode === 'signIn') {
        const result = await signIn({ email, password });
        // Success is handled by the auth listener, which swaps this screen out.
        if (!result.ok) {
          setFeedback({ kind: 'error', text: result.message });
          setCanResend(result.code === 'email_not_confirmed');
        }
      } else {
        const result = await signUp({ email, password });
        if (!result.ok) {
          setFeedback({ kind: 'error', text: result.message });
        } else if (result.value.needsEmailConfirmation) {
          switchMode('signIn');
          setCanResend(true);
          setFeedback({ kind: 'info', text: CONFIRMATION_SENT });
        }
      }
    });
  };

  // Resends the sign-up confirmation email. Errors (including network failures) never leave the form stuck.
  const resend = () =>
    run(async () => {
      const result = await resendConfirmation(email);
      setFeedback(result.ok ? { kind: 'info', text: CONFIRMATION_RESENT } : { kind: 'error', text: result.message });
    });

  return {
    mode,
    fields: { email, password, termsAccepted, aiAccepted },
    setEmail,
    setPassword,
    setTermsAccepted,
    setAiAccepted,
    errors,
    submitting,
    feedback,
    canResend,
    switchMode,
    submit,
    resend,
  };
}
