import type { AuthError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { LEGAL_VERSIONS } from '@/features/legal/documents';
import { supabase } from '@/lib/supabase';

export interface Credentials {
  email: string;
  password: string;
}

export const MIN_PASSWORD_LENGTH = 8;

export type AuthResult<T = void> = { ok: true; value: T } | { ok: false; message: string; code?: string };

// Deliberately generic where Supabase is: never reveal whether an account exists.
const ERROR_MESSAGES: Partial<Record<string, string>> = {
  invalid_credentials: 'האימייל או הסיסמה שגויים.',
  email_not_confirmed: 'יש לאשר את כתובת האימייל לפני ההתחברות.',
  user_already_exists: 'לא ניתן ליצור חשבון עם האימייל הזה.',
  weak_password: 'הסיסמה חלשה מדי. בחרו סיסמה ארוכה ופחות צפויה.',
  over_request_rate_limit: 'יותר מדי ניסיונות. המתינו דקה ונסו שוב.',
  over_email_send_rate_limit: 'נשלחו יותר מדי הודעות. המתינו מעט ונסו שוב.',
  signup_disabled: 'ההרשמה סגורה כרגע.',
  same_password: 'הסיסמה החדשה זהה לסיסמה הנוכחית.',
  reauthentication_needed: 'מטעמי אבטחה יש להתחבר מחדש לפני שינוי הסיסמה.',
  session_not_found: 'פג תוקף הקישור או ההתחברות. בקשו קישור חדש.',
  otp_expired: 'פג תוקף הקישור. בקשו קישור חדש.',
};

function fail(error: AuthError): { ok: false; message: string; code?: string } {
  const known = error.code ? ERROR_MESSAGES[error.code] : undefined;
  return { ok: false, message: known ?? 'משהו השתבש. נסו שוב.', code: error.code };
}

// Where the email confirmation link returns to (http://…/ on web, dogos:// on native).
const redirectTo = () => Linking.createURL('/');

export async function signIn({ email, password }: Credentials): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? fail(error) : { ok: true, value: undefined };
}

export interface SignUpOutcome {
  needsEmailConfirmation: boolean;
}

/** The DB trigger records the sign-up consents from this metadata at account creation. */
export async function signUp({ email, password }: Credentials): Promise<AuthResult<SignUpOutcome>> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: redirectTo(),
      data: {
        consents: [
          { type: 'terms_of_service', version: LEGAL_VERSIONS.terms_of_service },
          { type: 'privacy_policy', version: LEGAL_VERSIONS.privacy_policy },
          { type: 'ai_disclaimer', version: LEGAL_VERSIONS.ai_disclaimer },
        ],
      },
    },
  });
  if (error) return fail(error);
  return { ok: true, value: { needsEmailConfirmation: data.session === null } };
}

export async function resendConfirmation(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: { emailRedirectTo: redirectTo() },
  });
  return error ? fail(error) : { ok: true, value: undefined };
}

/** Emails a recovery link that opens the set-password screen. Always reports success to the UI so the
 * response never reveals whether the address has an account. */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: Linking.createURL('/account/password'),
  });
  if (error && (error.code === 'over_request_rate_limit' || error.code === 'over_email_send_rate_limit')) return fail(error);
  return { ok: true, value: undefined };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  return error ? fail(error) : { ok: true, value: undefined };
}

/**
 * Native only: email links (confirmation, password recovery) open the app as dogos://…?code=… (PKCE).
 * The code is useless without the verifier this device stored when it requested the link, so another
 * app that registers the same URL scheme can't turn an intercepted link into a session. On web,
 * supabase-js reads the URL itself (detectSessionInUrl). Returns the link type when a session was established.
 */
export async function createSessionFromUrl(url: string): Promise<string | null> {
  const callback = parseAuthCallbackUrl(url);
  if (!callback) return null;
  if (callback.kind === 'code') {
    const { data, error } = await supabase.auth.exchangeCodeForSession(callback.code);
    if (error) return null;
    // auth-js returns redirectType ('recovery' for password links) at runtime but doesn't type it.
    const redirectType: unknown = (data as { redirectType?: unknown }).redirectType;
    return typeof redirectType === 'string' ? redirectType : 'signup';
  }
  // Implicit-flow links sent before the switch to PKCE (they expire within an hour of being sent).
  const { error } = await supabase.auth.setSession({ access_token: callback.accessToken, refresh_token: callback.refreshToken });
  return error ? null : callback.type;
}

export type AuthCallback =
  | { kind: 'code'; code: string }
  | { kind: 'tokens'; accessToken: string; refreshToken: string; type: string };

/** Reads a PKCE code (query) or, for legacy links, session tokens (fragment) from an auth email link; null for any other link. */
export function parseAuthCallbackUrl(url: string): AuthCallback | null {
  const queryStart = url.indexOf('?');
  const hashIndex = url.indexOf('#');
  if (queryStart !== -1 && (hashIndex === -1 || queryStart < hashIndex)) {
    const code = new URLSearchParams(url.slice(queryStart + 1, hashIndex === -1 ? undefined : hashIndex)).get('code');
    if (code) return { kind: 'code', code };
  }
  if (hashIndex === -1) return null;
  const params = new URLSearchParams(url.slice(hashIndex + 1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { kind: 'tokens', accessToken, refreshToken, type: params.get('type') ?? 'unknown' };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return error ? fail(error) : { ok: true, value: undefined };
}
