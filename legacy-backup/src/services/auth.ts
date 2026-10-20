import type { AuthError } from '@supabase/supabase-js';

import { supabase } from './supabaseClient';

export interface Credentials {
  email: string;
  password: string;
}

export type AuthResult<T = void> = { ok: true; value: T } | { ok: false; message: string };

export interface SignUpOutcome {
  // True when the project requires email confirmation: no session is issued until the link is clicked.
  needsEmailConfirmation: boolean;
}

// Messages are deliberately generic where Supabase is: never reveal whether an account exists.
const ERROR_MESSAGES: Partial<Record<string, string>> = {
  invalid_credentials: 'Incorrect email or password.',
  email_not_confirmed: 'Confirm your email address before signing in.',
  user_already_exists: 'Could not create an account with this email.',
  weak_password: 'Password is too weak. Use a longer, less common password.',
  over_request_rate_limit: 'Too many attempts. Wait a minute and try again.',
  over_email_send_rate_limit: 'Too many emails sent. Wait a minute and try again.',
  signup_disabled: 'Sign-ups are currently disabled.',
};

function fail(error: AuthError): { ok: false; message: string } {
  const known = error.code ? ERROR_MESSAGES[error.code] : undefined;
  return { ok: false, message: known ?? 'Something went wrong. Please try again.' };
}

export async function signInWithPassword({ email, password }: Credentials): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? fail(error) : { ok: true, value: undefined };
}

export async function signUpWithPassword({
  email,
  password,
}: Credentials): Promise<AuthResult<SignUpOutcome>> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) return fail(error);
  return { ok: true, value: { needsEmailConfirmation: data.session === null } };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return error ? fail(error) : { ok: true, value: undefined };
}
