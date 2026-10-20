// Single entry point for client-side configuration.
// Everything here is bundled into the app and readable by anyone, so only public values belong here.
// Expo inlines EXPO_PUBLIC_* vars at build time only for static `process.env.EXPO_PUBLIC_X` access —
// never read them dynamically (process.env[name]) or via destructuring.

export interface SupabaseEnv {
  readonly url: string;
  readonly publishableKey: string;
}

export class EnvError extends Error {
  override readonly name = 'EnvError';
}

const ENV_HINT = 'Set it in .env.local (see .env.example), then restart with `npx expo start --clear`.';

function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new EnvError(`Missing ${name}. ${ENV_HINT}`);
  }
  return trimmed;
}

function parseSupabaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new EnvError(`EXPO_PUBLIC_SUPABASE_URL is not a valid URL: "${raw}".`);
  }
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !isLocal) {
    throw new EnvError('EXPO_PUBLIC_SUPABASE_URL must use https (http is allowed only for localhost).');
  }
  return url.origin;
}

function decodeJwtRole(token: string): string | undefined {
  const payload = token.split('.')[1];
  if (!payload) return undefined;
  try {
    const json: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof json === 'object' && json !== null && 'role' in json && typeof json.role === 'string') {
      return json.role;
    }
  } catch {
    // Not a decodable JWT; the format check below decides.
  }
  return undefined;
}

// A secret / service_role key bypasses Row Level Security. Shipping one in the bundle exposes all data,
// so refuse to start rather than silently run with it.
function parsePublishableKey(raw: string): string {
  if (raw.startsWith('sb_secret_') || decodeJwtRole(raw) === 'service_role') {
    throw new EnvError(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is a secret/service_role key. Use the publishable (or anon) key; secret keys must never ship in the app.'
    );
  }
  const isPublishable = raw.startsWith('sb_publishable_');
  const isLegacyAnonJwt = decodeJwtRole(raw) === 'anon';
  if (!isPublishable && !isLegacyAnonJwt) {
    throw new EnvError(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not a recognized Supabase publishable key (expected "sb_publishable_..." or a legacy anon JWT).'
    );
  }
  return raw;
}

export type EnvResult = { ok: true; env: SupabaseEnv } | { ok: false; error: EnvError };

/**
 * Validates raw config. Returns a result instead of throwing so a misconfigured build renders an error
 * screen (see the root layout) rather than crashing while modules load, before any error boundary exists.
 */
export function readSupabaseEnv(raw: { url: string | undefined; publishableKey: string | undefined }): EnvResult {
  try {
    return {
      ok: true,
      env: Object.freeze({
        url: parseSupabaseUrl(required('EXPO_PUBLIC_SUPABASE_URL', raw.url)),
        publishableKey: parsePublishableKey(required('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', raw.publishableKey)),
      }),
    };
  } catch (error) {
    if (error instanceof EnvError) return { ok: false, error };
    throw error;
  }
}

/**
 * Development-only switch (EXPO_PUBLIC_DEV_SKIP_CONSENT_GATE=1): skip the consent screen for users without
 * consent records, so local testing isn't interrupted. Production builds always ignore it (__DEV__ is false).
 */
export function readDevSkipConsentGate(isDev: boolean, raw: string | undefined): boolean {
  return isDev && raw?.trim() === '1';
}

export const devSkipConsentGate = readDevSkipConsentGate(__DEV__, process.env.EXPO_PUBLIC_DEV_SKIP_CONSENT_GATE);

export const supabaseEnvResult: EnvResult = readSupabaseEnv({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
