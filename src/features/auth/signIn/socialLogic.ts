// Which social sign-in buttons a platform shows, and how each one signs in. Pure, so it is unit-tested.

export type SocialProvider = 'google' | 'apple';

/** 'native': the system Sign in with Apple sheet (iOS). 'browser': the provider's page via Supabase OAuth (PKCE). */
export type SocialMethod = 'native' | 'browser';

export interface SocialButton {
  provider: SocialProvider;
  method: SocialMethod;
}

/** 'redirecting': web left the page for the provider and comes back signed in. */
export type SocialOutcome = 'signedIn' | 'cancelled' | 'redirecting';

export const PROVIDER_NAME: Record<SocialProvider, string> = { google: 'Google', apple: 'Apple' };

/** The visible label and screen-reader name of a social button. */
export function socialLabel(provider: SocialProvider): string {
  return `המשך עם ${PROVIDER_NAME[provider]}`;
}

/** The social buttons for a platform: Apple uses the system sheet where iOS offers it, the browser flow elsewhere. */
export function socialButtons(os: string, appleNativeAvailable: boolean): readonly SocialButton[] {
  const appleMethod: SocialMethod = os === 'ios' && appleNativeAvailable ? 'native' : 'browser';
  return [
    { provider: 'google', method: 'browser' },
    { provider: 'apple', method: appleMethod },
  ];
}

/** Whether a Sign in with Apple failure is the user closing the sheet, which is not an error. */
export function isAppleCancel(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !Object.prototype.hasOwnProperty.call(error, 'code')) return false;
  return (error as { code: unknown }).code === 'ERR_REQUEST_CANCELED';
}
