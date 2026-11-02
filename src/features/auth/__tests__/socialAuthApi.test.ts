import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

import { signInWithAppleNative, signInWithProvider } from '../api';

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithIdToken: jest.fn(), signInWithOAuth: jest.fn(), exchangeCodeForSession: jest.fn(), getSession: jest.fn() } },
}));
jest.mock('expo-apple-authentication', () => ({ signInAsync: jest.fn(), AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 } }));
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'raw-nonce'),
  digestStringAsync: jest.fn(() => Promise.resolve('hashed-nonce')),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));
jest.mock('expo-linking', () => ({ createURL: jest.fn(() => 'dogos://') }));

const auth = jest.mocked(supabase.auth);
const signInAsync = jest.mocked(AppleAuthentication.signInAsync);
const openAuthSession = jest.mocked(WebBrowser.openAuthSessionAsync);

beforeEach(() => jest.clearAllMocks());

describe('signInWithAppleNative', () => {
  it('sends Apple the hashed nonce and Supabase the raw one, asking only for the email', async () => {
    signInAsync.mockResolvedValue({ identityToken: 'id-token' } as never);
    auth.signInWithIdToken.mockResolvedValue({ data: {}, error: null } as never);

    await expect(signInWithAppleNative()).resolves.toEqual({ ok: true, value: 'signedIn' });
    expect(signInAsync).toHaveBeenCalledWith({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL], nonce: 'hashed-nonce' });
    expect(auth.signInWithIdToken).toHaveBeenCalledWith({ provider: 'apple', token: 'id-token', nonce: 'raw-nonce' });
  });

  it('treats closing the Apple sheet as a cancel, not an error', async () => {
    signInAsync.mockRejectedValue({ code: 'ERR_REQUEST_CANCELED' });
    await expect(signInWithAppleNative()).resolves.toEqual({ ok: true, value: 'cancelled' });
    expect(auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('fails when Apple errors or returns no identity token', async () => {
    signInAsync.mockRejectedValueOnce(new Error('ERR_REQUEST_FAILED'));
    await expect(signInWithAppleNative()).resolves.toMatchObject({ ok: false });
    signInAsync.mockResolvedValueOnce({ identityToken: null } as never);
    await expect(signInWithAppleNative()).resolves.toMatchObject({ ok: false });
    expect(auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('shows Supabase errors in plain Hebrew', async () => {
    signInAsync.mockResolvedValue({ identityToken: 'id-token' } as never);
    auth.signInWithIdToken.mockResolvedValue({ data: {}, error: { code: 'over_request_rate_limit', message: 'raw server text' } } as never);
    await expect(signInWithAppleNative()).resolves.toEqual({ ok: false, message: 'יותר מדי ניסיונות. המתינו דקה ונסו שוב.', code: 'over_request_rate_limit' });
  });
});

describe('signInWithProvider (native)', () => {
  beforeEach(() => {
    auth.signInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: 'https://auth.example/authorize' }, error: null } as never);
  });

  it('opens an auth session and exchanges the returned PKCE code', async () => {
    openAuthSession.mockResolvedValue({ type: 'success', url: 'dogos://?code=abc' });
    auth.exchangeCodeForSession.mockResolvedValue({ data: {}, error: null } as never);
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null } as never);

    await expect(signInWithProvider('google')).resolves.toEqual({ ok: true, value: 'signedIn' });
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'dogos://', skipBrowserRedirect: true } });
    expect(openAuthSession).toHaveBeenCalledWith('https://auth.example/authorize', 'dogos://');
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('abc');
  });

  it('still succeeds when the app-link handler already used the code', async () => {
    openAuthSession.mockResolvedValue({ type: 'success', url: 'dogos://?code=abc' });
    auth.exchangeCodeForSession.mockResolvedValue({ data: {}, error: { code: 'flow_state_not_found' } } as never);
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null } as never);
    await expect(signInWithProvider('apple')).resolves.toEqual({ ok: true, value: 'signedIn' });
  });

  it('reports a cancel when the user closes the browser', async () => {
    // The module is mocked, so its WebBrowserResultType enum isn't available; 'cancel' is its runtime value.
    openAuthSession.mockResolvedValue({ type: 'cancel' } as never);
    await expect(signInWithProvider('google')).resolves.toEqual({ ok: true, value: 'cancelled' });
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('fails when no session came out of the redirect', async () => {
    openAuthSession.mockResolvedValue({ type: 'success', url: 'dogos://?error=access_denied' });
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null } as never);
    await expect(signInWithProvider('google')).resolves.toMatchObject({ ok: false });
  });

  it('fails without opening a browser when Supabase refuses to start', async () => {
    auth.signInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: null }, error: { code: 'provider_disabled' } } as never);
    await expect(signInWithProvider('google')).resolves.toMatchObject({ ok: false });
    expect(openAuthSession).not.toHaveBeenCalled();
  });
});

describe('signInWithProvider (web)', () => {
  it('hands the page over to the provider and lets supabase-js finish on return', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    auth.signInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: 'https://auth.example' }, error: null } as never);

    await expect(signInWithProvider('google')).resolves.toEqual({ ok: true, value: 'redirecting' });
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'dogos://' } });
    expect(openAuthSession).not.toHaveBeenCalled();
  });
});
