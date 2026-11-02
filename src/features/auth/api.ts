import type { AuthError } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { LEGAL_VERSIONS } from '@/features/legal/documents';
import { supabase } from '@/lib/supabase';

import { isAppleCancel, type SocialOutcome, type SocialProvider } from './signIn/socialLogic';

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

// Social sign-ins carry no consent metadata, so a new account lands on the consent screen (consentGate)
// before anything else is reachable – the same documents and versions as email sign-up.
const SOCIAL_FAILED = { ok: false, message: 'ההתחברות לא הושלמה. נסו שוב.' } as const;

/**
 * iOS: Sign in with Apple through the system sheet. Apple receives a SHA-256 of a one-time nonce and
 * Supabase the raw nonce, so an intercepted identity token can't be replayed. Only the email is requested.
 */
export async function signInWithAppleNative(): Promise<AuthResult<SocialOutcome>> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let identityToken: string | null;
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
    identityToken = credential.identityToken;
  } catch (error) {
    return isAppleCancel(error) ? { ok: true, value: 'cancelled' } : SOCIAL_FAILED;
  }
  if (!identityToken) return SOCIAL_FAILED;
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken, nonce: rawNonce });
  return error ? fail(error) : { ok: true, value: 'signedIn' };
}

/**
 * Google, and Apple off iOS, through the provider's page (PKCE). Web hands the whole page over and
 * supabase-js finishes on return; native opens an auth session and exchanges the returned code.
 */
export async function signInWithProvider(provider: SocialProvider): Promise<AuthResult<SocialOutcome>> {
  const returnTo = redirectTo();
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: returnTo } });
    return error ? fail(error) : { ok: true, value: 'redirecting' };
  }
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: returnTo, skipBrowserRedirect: true } });
  if (error) return fail(error);
  const result = await WebBrowser.openAuthSessionAsync(data.url, returnTo);
  if (result.type !== 'success') return { ok: true, value: 'cancelled' };
  await createSessionFromUrl(result.url);
  // Android can also deliver the redirect as an app link, which the session guard may exchange first;
  // the code works once, so whichever exchange won, a session now exists or the sign-in failed.
  const { data: current } = await supabase.auth.getSession();
  return current.session ? { ok: true, value: 'signedIn' } : SOCIAL_FAILED;
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
  // Links carrying raw tokens (the pre-PKCE implicit flow) are refused: any link or app could otherwise
  // sign this device into someone else's account. Those links expired within an hour of the PKCE switch.
  return null;
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
