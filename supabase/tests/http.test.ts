// Tests for the Edge Function helpers that are plain TypeScript (no Deno APIs), run by Jest.
import { corsHeadersFor, errorResponse, isUuid, israelDate, logError, parseAllowedOrigins, withCors } from '../functions/_shared/http';

describe('logError (Edge Functions)', () => {
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => consoleError.mockRestore());

  const logged = () => {
    const [tag, payload] = consoleError.mock.calls[0] as [string, string];
    return { tag, entry: JSON.parse(payload) as Record<string, unknown> };
  };

  it('logs only name, code, status and message', () => {
    const error = Object.assign(new Error('row violates policy'), { code: '42501', status: 403, details: 'secret row data', body: { note: 'private journal' } });
    logError('chat:unexpected', error);

    const { tag, entry } = logged();
    expect(tag).toBe('[chat:unexpected]');
    expect(entry).toEqual({ name: 'Error', code: '42501', status: 403, message: 'row violates policy' });
  });

  it('redacts emails, tokens and keys from messages', () => {
    logError('x', new Error('user owner@example.com token eyJhbGciOi.eyJzdWIiOiIx.c2lnbmF0dXJl key sk_live_0123456789abcdefgh'));
    expect(logged().entry.message).toBe('user [email] token [token] key [secret]');
  });

  it('truncates long messages', () => {
    logError('x', new Error('a'.repeat(1000)));
    expect((logged().entry.message as string).length).toBe(300);
  });

  it('handles non-Error values without leaking them', () => {
    logError('x', { password: 'hunter2' });
    expect(logged().entry).toEqual({ name: 'object' });
  });
});

describe('http helpers', () => {
  it('returns a JSON error that leaves withCors with CORS headers', async () => {
    const serve = withCors([], async () => errorResponse('ai_opted_out', 403));
    const response = await serve(new Request('https://fn.local/chat', { method: 'POST' }));
    expect(response.status).toBe(403);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    await expect(response.json()).resolves.toEqual({ error: { code: 'ai_opted_out', message: 'ai_opted_out' } });
  });

  it('validates UUIDs', () => {
    expect(isUuid('00000000-0000-4000-8000-000000000001')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid(42)).toBe(false);
  });

  it('uses the Israel calendar date', () => {
    // 22:30 UTC on 18 Oct is already 19 Oct in Israel (UTC+3).
    expect(israelDate(new Date('2026-10-18T22:30:00Z'))).toBe('2026-10-19');
  });
});

describe('CORS (Edge Functions)', () => {
  const allowed = parseAllowedOrigins(' https://app.dogos.co.il/ , https://staging.dogos.co.il,,');

  it('parses the allowlist, trimming spaces, trailing slashes and empties', () => {
    expect(allowed).toEqual(['https://app.dogos.co.il', 'https://staging.dogos.co.il']);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });

  it('allows any origin when no allowlist is configured', () => {
    expect(corsHeadersFor('https://evil.example', [])['Access-Control-Allow-Origin']).toBe('*');
  });

  it('echoes only allowlisted origins and varies on Origin', () => {
    expect(corsHeadersFor('https://app.dogos.co.il', allowed)).toMatchObject({ 'Access-Control-Allow-Origin': 'https://app.dogos.co.il', Vary: 'Origin' });
    expect(corsHeadersFor('https://evil.example', allowed)['Access-Control-Allow-Origin']).toBeUndefined();
    expect(corsHeadersFor(null, allowed)['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('withCors answers preflights, rejects non-POST and stamps headers on handler responses', async () => {
    const handler = jest.fn(async () => new Response('{}', { status: 200 }));
    const serve = withCors(allowed, handler);
    const request = (method: string) => new Request('https://fn.local/chat', { method, headers: { Origin: 'https://app.dogos.co.il' } });

    const preflight = await serve(request('OPTIONS'));
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe('https://app.dogos.co.il');
    expect(handler).not.toHaveBeenCalled();

    expect((await serve(request('GET'))).status).toBe(405);
    expect(handler).not.toHaveBeenCalled();

    const ok = await serve(request('POST'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(ok.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
  });
});
