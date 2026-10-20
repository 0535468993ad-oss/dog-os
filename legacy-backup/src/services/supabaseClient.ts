import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { supabaseEnv } from '@/config/env';

import type { Database } from './database.types';

export type TypedSupabaseClient = SupabaseClient<Database>;

const isWeb = Platform.OS === 'web';

// AsyncStorage is backed by window.localStorage on web, which doesn't exist during static/server rendering.
const canPersistSession = !isWeb || typeof window !== 'undefined';

export const supabase: TypedSupabaseClient = createClient<Database>(
  supabaseEnv.url,
  supabaseEnv.publishableKey,
  {
    auth: {
      storage: canPersistSession ? AsyncStorage : undefined,
      persistSession: canPersistSession,
      autoRefreshToken: true,
      // Only the web build can receive a session via URL (OAuth / magic link redirects).
      detectSessionInUrl: isWeb,
    },
  }
);

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
