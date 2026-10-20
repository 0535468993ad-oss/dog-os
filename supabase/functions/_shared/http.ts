// CORS + JSON helpers shared by all Edge Functions. Browsers (the Expo web build) send a preflight
// because supabase-js adds Authorization / apikey / x-client-info headers. Plain TypeScript (no Deno
// APIs), so it is unit-tested from supabase/tests/.

const BASE_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/** Parses the ALLOWED_ORIGINS secret: comma-separated exact origins; empty/unset means "any origin". */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/**
 * CORS headers for one request. Auth is a Bearer token, never a cookie, so a foreign site gets no ambient
 * credentials either way; the allowlist additionally stops other sites' scripts from calling the API with
 * a token they somehow obtained. Native apps send no Origin and are unaffected by CORS.
 */
export function corsHeadersFor(origin: string | null, allowed: readonly string[]): Record<string, string> {
  if (allowed.length === 0) return { ...BASE_CORS_HEADERS, 'Access-Control-Allow-Origin': '*' };
  const headers: Record<string, string> = { ...BASE_CORS_HEADERS, Vary: 'Origin' };
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

/**
 * Wraps a POST handler: answers preflights, rejects other methods, and stamps CORS headers on every
 * response, so no handler can forget them.
 */
export function withCors(allowed: readonly string[], handler: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
  return async (req) => {
    const cors = corsHeadersFor(req.headers.get('Origin'), allowed);
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    const response = req.method === 'POST' ? await handler(req) : errorResponse('bad_request', 405);
    for (const [key, value] of Object.entries(cors)) response.headers.set(key, value);
    return response;
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export type ErrorCode =
  | 'unauthorized'
  | 'bad_request'
  | 'not_found'
  | 'rate_limited'
  | 'ai_unavailable'
  | 'ai_refused'
  | 'ai_opted_out'
  | 'internal';

export function errorResponse(code: ErrorCode, status: number, message?: string): Response {
  return json({ error: { code, message: message ?? code } }, status);
}

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const JWT = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const LONG_SECRET = /\b(sk|sb)_[\w-]{16,}/g;

/**
 * The only way Edge Functions log errors. Logs keep the error's type, code, status and a redacted,
 * truncated message – never the error object itself, which can carry request bodies, user text or tokens.
 */
export function logError(tag: string, error: unknown): void {
  const e = (error ?? {}) as { name?: unknown; code?: unknown; status?: unknown; message?: unknown };
  const message = typeof e.message === 'string'
    ? e.message.replace(EMAIL, '[email]').replace(JWT, '[token]').replace(LONG_SECRET, '[secret]').slice(0, 300)
    : undefined;
  console.error(`[${tag}]`, JSON.stringify({
    name: typeof e.name === 'string' ? e.name : typeof error,
    code: typeof e.code === 'string' || typeof e.code === 'number' ? e.code : undefined,
    status: typeof e.status === 'number' ? e.status : undefined,
    message,
  }));
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Calendar date in Israel, used for "today" in streaks and the daily insights cache key.
export function israelDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(date);
}
