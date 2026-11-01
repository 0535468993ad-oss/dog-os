// Auth deep links and session safety: callback parsing, refusing raw-token links, and a fresh cache
// whenever a different user signs in.
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { clearDeviceHealthData } from '@/features/health/api';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

import { AuthProvider } from '../AuthProvider';
import { createSessionFromUrl, parseAuthCallbackUrl } from '../api';

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { setSession: jest.fn(), exchangeCodeForSession: jest.fn(), onAuthStateChange: jest.fn() } },
  unwrap: jest.fn(),
}));
jest.mock('@/features/health/api', () => ({ clearDeviceHealthData: jest.fn(() => Promise.resolve()) }));


describe('parseAuthCallbackUrl', () => {
  it('reads a PKCE code from the query', () => {
    expect(parseAuthCallbackUrl('dogos://account/password?code=8b1f-42')).toEqual({ kind: 'code', code: '8b1f-42' });
  });

  it('prefers the PKCE code when a link carries both', () => {
    expect(parseAuthCallbackUrl('dogos://?code=c1#access_token=a&refresh_token=r')).toEqual({ kind: 'code', code: 'c1' });
  });

  it('does not read a "code" that only appears in the fragment as a PKCE code', () => {
    expect(parseAuthCallbackUrl('dogos://#code=c1')).toBeNull();
  });

  it('reads legacy tokens and the link type from the URL fragment', () => {
    expect(parseAuthCallbackUrl('dogos://account/password#access_token=a.b.c&refresh_token=r1&type=recovery&expires_in=3600')).toEqual({
      kind: 'tokens',
      accessToken: 'a.b.c',
      refreshToken: 'r1',
      type: 'recovery',
    });
  });

  it('defaults the type when a legacy link omits it', () => {
    const callback = parseAuthCallbackUrl('dogos://#access_token=a&refresh_token=r');
    expect(callback?.kind === 'tokens' && callback.type).toBe('unknown');
  });

  it.each([
    ['dogos://journal'],
    ['dogos://journal?tab=mood'], // a query without a code
    ['dogos://?error=access_denied&error_code=otp_expired'], // an expired link
    ['dogos://#type=recovery'],
    ['dogos://#access_token=a'], // no refresh token: can't establish a session
    ['dogos://?access_token=a&refresh_token=r'], // tokens in the query, not the fragment
  ])('ignores links without a code or a complete session (%s)', (url) => {
    expect(parseAuthCallbackUrl(url)).toBeNull();
  });
});

describe('createSessionFromUrl', () => {
  it('refuses links that carry raw session tokens, so no link can swap the signed-in account', async () => {
    await expect(createSessionFromUrl('dogos://#access_token=a&refresh_token=r&type=signup')).resolves.toBeNull();
    expect(supabase.auth.setSession).not.toHaveBeenCalled();
  });
});

describe('AuthProvider cache ownership', () => {
  type Listener = (event: string, session: { user: { id: string } } | null) => void;
  let emit: Listener = () => undefined;

  beforeEach(() => {
    jest.mocked(supabase.auth.onAuthStateChange).mockImplementation(((listener: Listener) => {
      emit = listener;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    }) as never);
  });

  const session = (id: string) => ({ user: { id } });

  it('clears the cache when a different user signs in without signing out first', async () => {
    const clear = jest.spyOn(queryClient, 'clear').mockImplementation(() => undefined);
    await render(
      <AuthProvider>
        <Text>app</Text>
      </AuthProvider>,
    );

    emit('INITIAL_SESSION', session('user-a'));
    emit('TOKEN_REFRESHED', session('user-a'));
    expect(clear).not.toHaveBeenCalled();

    emit('SIGNED_IN', session('user-b'));
    expect(clear).toHaveBeenCalledTimes(1);
    clear.mockRestore();
  });

  it('clears the cache and the device-only vet number on sign-out', async () => {
    const clear = jest.spyOn(queryClient, 'clear').mockImplementation(() => undefined);
    await render(
      <AuthProvider>
        <Text>app</Text>
      </AuthProvider>,
    );

    emit('INITIAL_SESSION', session('user-a'));
    emit('SIGNED_OUT', null);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(clearDeviceHealthData).toHaveBeenCalled();
    clear.mockRestore();
  });
});

