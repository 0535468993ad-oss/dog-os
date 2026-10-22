import { FunctionsHttpError } from '@supabase/supabase-js';

export const GENERIC_ERROR = 'משהו השתבש. נסו שוב.';
export const NETWORK_ERROR = 'אין חיבור לשרת. בדקו את החיבור לאינטרנט ונסו שוב.';

/** What may leave the device about an error: no user content, form values, tokens or identifiers. */
export interface SanitizedError {
  where: string;
  name: string;
  code?: string | number;
  message?: string;
}

const REDACTIONS: [RegExp, string][] = [
  [/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]'],
  [/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[token]'],
  [/\b(sk|sb)_[\w-]{16,}/g, '[secret]'],
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id]'],
];

export function sanitizeError(error: unknown, where: string): SanitizedError {
  const e = (error ?? {}) as { name?: unknown; code?: unknown; message?: unknown };
  const name = typeof e.name === 'string' ? e.name : typeof error;
  const code = typeof e.code === 'string' || typeof e.code === 'number' ? e.code : undefined;
  const message =
    typeof e.message === 'string' ? REDACTIONS.reduce((text, [pattern, label]) => text.replace(pattern, label), e.message).slice(0, 300) : undefined;
  return { where, name, ...(code !== undefined ? { code } : {}), ...(message !== undefined ? { message } : {}) };
}

type ErrorSink = (error: SanitizedError) => void;
let sink: ErrorSink | null = null;

/** Plug in crash reporting here. The sink only ever receives sanitized errors. */
export function setErrorSink(next: ErrorSink | null): void {
  sink = next;
}

/**
 * Single reporting path for unexpected errors (render crashes, failed background work). The full error
 * is logged in development only; production builds never write it to the console, and an installed sink
 * receives just the sanitized summary (GDPR data minimization).
 */
export function reportError(error: unknown, where: string): void {
  if (__DEV__) console.error(`[${where}]`, error);
  try {
    sink?.(sanitizeError(error, where));
  } catch {
    // Reporting must never throw into the caller.
  }
}

/** User-facing Hebrew message. Never surfaces raw server/database messages. */
export function toUserMessage(error: unknown, fallback = GENERIC_ERROR): string {
  if (__DEV__) console.warn('[error]', error);
  if (error instanceof TypeError && /network|fetch/i.test(error.message)) return NETWORK_ERROR;
  return fallback;
}

export interface EdgeFunctionError {
  code: string;
  status: number;
}

/**
 * The code for a response that did not come from our function: the Supabase gateway answers with
 * `{ code, message }` (no `error` object) when the function isn't deployed, failed to boot, or the
 * gateway rejected the JWT.
 */
function gatewayCode(status: number): string {
  if (status === 404) return 'not_deployed';
  if (status === 401) return 'unauthorized';
  return status >= 500 ? 'unavailable' : 'internal';
}

/** Extracts `{ error: { code } }` and the HTTP status from a supabase.functions.invoke error. */
export async function readFunctionError(error: unknown): Promise<EdgeFunctionError> {
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response;
    try {
      const body = (await response.json()) as { error?: { code?: unknown } };
      const code = body.error?.code;
      return { code: typeof code === 'string' ? code : gatewayCode(response.status), status: response.status };
    } catch {
      return { code: gatewayCode(response.status), status: response.status };
    }
  }
  return { code: 'network', status: 0 };
}
