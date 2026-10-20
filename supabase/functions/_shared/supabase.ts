import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.118.0';

import { logError } from './http.ts';

// Supabase injects SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS (JSON maps of named keys) on projects
// using the new API keys, and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY on legacy projects.
function pickKey(namedKeys: string | undefined, legacyKey: string | undefined): string | undefined {
  if (namedKeys) {
    try {
      const parsed: unknown = JSON.parse(namedKeys);
      if (typeof parsed === 'string') return parsed;
      if (parsed && typeof parsed === 'object') {
        const record = parsed as Record<string, unknown>;
        const preferred = record.default;
        if (typeof preferred === 'string') return preferred;
        const first = Object.values(record).find((value): value is string => typeof value === 'string');
        if (first) return first;
      }
    } catch {
      return namedKeys;
    }
  }
  return legacyKey;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const PUBLISHABLE_KEY = pickKey(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'), Deno.env.get('SUPABASE_ANON_KEY'));
const SECRET_KEY = pickKey(Deno.env.get('SUPABASE_SECRET_KEYS'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

const SERVER_AUTH = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } as const;

export interface AuthedContext {
  user: User;
  /** Runs as the caller: every query is subject to RLS. Use for all reads of user data. */
  userClient: SupabaseClient;
  /** Bypasses RLS. Use only for writes clients are not allowed to make (chat messages, insights). */
  adminClient: SupabaseClient;
}

export class ConfigError extends Error {}

/**
 * Whether the caller allows their data to be sent to the AI provider (opt-out, recorded in user_consents;
 * see public.ai_data_sharing_allowed). Fails closed: if it can't be determined, nothing is sent.
 */
export async function aiDataSharingAllowed(userClient: SupabaseClient): Promise<boolean> {
  const { data, error } = await userClient.rpc('ai_data_sharing_allowed');
  if (error) {
    logError('ai-consent', error);
    return false;
  }
  return data === true;
}

export async function authenticate(req: Request): Promise<AuthedContext | null> {
  if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SECRET_KEY) {
    throw new ConfigError('Supabase environment variables are missing in the Edge runtime.');
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const userClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: SERVER_AUTH,
  });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) return null;

  const adminClient = createClient(SUPABASE_URL, SECRET_KEY, { auth: SERVER_AUTH });
  return { user: data.user, userClient, adminClient };
}
