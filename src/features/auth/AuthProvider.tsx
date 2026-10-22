import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

import { LAST_ACTIVE_KEY } from './sessionGuards';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; session: Session; user: User };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    // Fires INITIAL_SESSION immediately with the persisted session (or null), then on every change.
    // Keep the callback synchronous: awaiting supabase calls inside it can deadlock the auth lock.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear(); // never leak one user's cache to the next
        void AsyncStorage.removeItem(LAST_ACTIVE_KEY).catch(() => undefined);
        // Training XP, streaks and trophies are not cleared: they live in Supabase, and the device copy
        // is only an offline cache keyed by dog id.
      }
      setState(session ? { status: 'signedIn', session, user: session.user } : { status: 'signedOut' });
    });
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** For screens inside the protected (app) group, where a user is guaranteed. */
export function useUser(): User {
  const auth = useAuth();
  if (auth.status !== 'signedIn') throw new Error('useUser called without a signed-in user');
  return auth.user;
}
