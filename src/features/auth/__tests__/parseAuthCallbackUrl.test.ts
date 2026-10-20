import { parseAuthCallbackUrl } from '../api';

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
