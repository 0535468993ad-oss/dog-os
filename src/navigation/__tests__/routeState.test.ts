import type { ConsentGate } from '@/features/legal/types';

import { rootRouteState } from '../routeState';

const SATISFIED: ConsentGate = { state: 'satisfied' };

describe('rootRouteState', () => {
  it('waits for fonts and auth', () => {
    expect(rootRouteState(false, 'signedIn', SATISFIED).loading).toBe(true);
    expect(rootRouteState(true, 'loading', SATISFIED).loading).toBe(true);
  });

  it('waits for consents only when signed in', () => {
    expect(rootRouteState(true, 'signedIn', { state: 'loading' }).loading).toBe(true);
    expect(rootRouteState(true, 'signedOut', { state: 'loading' }).loading).toBe(false);
  });

  it('lets a consented user into the app', () => {
    expect(rootRouteState(true, 'signedIn', SATISFIED)).toEqual({
      loading: false,
      signedIn: true,
      needsConsent: false,
      consentCheckFailed: false,
      devBypassReason: null,
    });
  });

  it('sends a user with missing consents to the consent screen', () => {
    expect(rootRouteState(true, 'signedIn', { state: 'required', missing: ['privacy_policy'] }).needsConsent).toBe(true);
  });

  it('fails closed when consent cannot be verified', () => {
    expect(rootRouteState(true, 'signedIn', { state: 'error' }).consentCheckFailed).toBe(true);
  });

  it('surfaces the development bypass reason', () => {
    expect(rootRouteState(true, 'signedIn', { state: 'bypassed_dev', reason: 'dev_flag' }).devBypassReason).toBe('dev_flag');
  });

  it('ignores consent state when signed out', () => {
    const route = rootRouteState(true, 'signedOut', { state: 'error' });
    expect(route).toMatchObject({ signedIn: false, needsConsent: false, consentCheckFailed: false, devBypassReason: null });
  });
});
