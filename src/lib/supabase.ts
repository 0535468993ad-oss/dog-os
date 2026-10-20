import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { supabaseEnvResult } from '@/config/env';

import type { Database } from './database.types';
import { sessionStorage } from './sessionStorage';

export type TypedSupabaseClient = SupabaseClient<Database>;

const isWeb = Platform.OS === 'web';

// AsyncStorage is backed by window.localStorage on web, which doesn't exist during static/server rendering.
const canPersistSession = !isWeb || typeof window !== 'undefined';

// With invalid config the root layout shows the configuration error and never mounts anything that uses
// the client; the inert placeholder only keeps module loading from throwing.
const { url, publishableKey } = supabaseEnvResult.ok
  ? supabaseEnvResult.env
  : { url: 'http://localhost:54321', publishableKey: 'unconfigured' };

export const supabase: TypedSupabaseClient = createClient<Database>(url, publishableKey, {
  auth: {
    // Native: hardware keystore (sessionStorage.ts). Web: localStorage (sessionStorage.web.ts).
    storage: canPersistSession ? sessionStorage : undefined,
    persistSession: canPersistSession,
    autoRefreshToken: true,
    // PKCE: email links carry a one-time code bound to a verifier stored on this device, never session
    // tokens, so an intercepted deep link (custom URL schemes are not exclusive on Android) is worthless.
    flowType: 'pkce',
    // Only the web build can receive a session via URL (email confirmation / magic link redirects).
    detectSessionInUrl: isWeb,
  },
});

// On native, token refresh runs on a timer, so pause it while the app is backgrounded.
if (!isWeb) {
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}

// Pure error classification lives apart from the client, so utils/ code can use it without the client.
export { isSchemaMissingError } from './supabaseErrors';

/**
 * Throws the Supabase error if present, otherwise returns the data. Takes the success/error union that
 * supabase-js returns, so the success type is preserved (including `| null` for maybeSingle()).
 */
type SuccessData<R> = R extends { error: null; data: infer D } ? D : never;

export function unwrap<R extends { data: unknown; error: unknown }>(result: R): SuccessData<R> {
  if (result.error) throw result.error;
  return result.data as SuccessData<R>;
}
