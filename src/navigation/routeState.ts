import type { AuthState } from '@/features/auth/AuthProvider';
import type { ConsentGate } from '@/features/legal/types';

type AuthStatus = AuthState['status'];

/** What the root navigator shows. */
export interface RouteState {
  /** Keep the splash screen up. */
  loading: boolean;
  signedIn: boolean;
  /** Signed in but required consents are missing: only the consent screen is reachable. */
  needsConsent: boolean;
  /** Signed in and consent couldn't be verified: hold at a retry screen (fail closed). */
  consentCheckFailed: boolean;
  /** Development bypass in effect: show the warning banner with this reason. */
  devBypassReason: 'schema_missing' | 'dev_flag' | null;
}

/** Derives the root routing state from fonts, auth and the consent gate. */
export function rootRouteState(fontsReady: boolean, auth: AuthStatus, gate: ConsentGate): RouteState {
  const signedIn = auth === 'signedIn';
  return {
    loading: !fontsReady || auth === 'loading' || (signedIn && gate.state === 'loading'),
    signedIn,
    needsConsent: signedIn && gate.state === 'required',
    consentCheckFailed: signedIn && gate.state === 'error',
    devBypassReason: signedIn && gate.state === 'bypassed_dev' ? gate.reason : null,
  };
}
