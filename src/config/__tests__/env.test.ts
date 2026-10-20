import { readDevSkipConsentGate, readSupabaseEnv } from '../env';

describe('readDevSkipConsentGate', () => {
  it('is on only for "1" in development builds', () => {
    expect(readDevSkipConsentGate(true, '1')).toBe(true);
    expect(readDevSkipConsentGate(true, ' 1 ')).toBe(true);
    expect(readDevSkipConsentGate(true, '0')).toBe(false);
    expect(readDevSkipConsentGate(true, 'true')).toBe(false);
    expect(readDevSkipConsentGate(true, undefined)).toBe(false);
  });

  it('can never be enabled in a production build', () => {
    expect(readDevSkipConsentGate(false, '1')).toBe(false);
  });
});

const jwt = (payload: object) => `${btoa('{"alg":"HS256"}')}.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.signature`;

const read = (url: string | undefined, publishableKey: string | undefined) => readSupabaseEnv({ url, publishableKey });

describe('readSupabaseEnv', () => {
  it('accepts an https project URL and a publishable key, normalizing the URL to its origin', () => {
    const result = read(' https://abc.supabase.co/rest/v1 ', 'sb_publishable_123');
    expect(result).toEqual({ ok: true, env: { url: 'https://abc.supabase.co', publishableKey: 'sb_publishable_123' } });
  });

  it('accepts a legacy anon JWT', () => {
    expect(read('https://abc.supabase.co', jwt({ role: 'anon' })).ok).toBe(true);
  });

  it('allows http only for local development', () => {
    expect(read('http://localhost:54321', 'sb_publishable_1').ok).toBe(true);
    const remote = read('http://abc.supabase.co', 'sb_publishable_1');
    expect(remote.ok).toBe(false);
    if (!remote.ok) expect(remote.error.message).toMatch(/https/);
  });

  it.each([
    [undefined, 'sb_publishable_1', /Missing EXPO_PUBLIC_SUPABASE_URL/],
    ['https://abc.supabase.co', '  ', /Missing EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY/],
    ['not a url', 'sb_publishable_1', /not a valid URL/],
    ['https://abc.supabase.co', 'random-string', /not a recognized/],
  ])('rejects invalid config (%s, %s)', (url, key, message) => {
    const result = read(url, key);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(message);
  });

  // A secret key in the public bundle would bypass Row Level Security for everyone.
  it.each([['sb_secret_abc'], [jwt({ role: 'service_role' })]])('refuses a secret key (%s)', (key) => {
    const result = read('https://abc.supabase.co', key);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/secret\/service_role/);
  });

  it('returns errors instead of throwing', () => {
    expect(() => read(undefined, undefined)).not.toThrow();
  });
});
