import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from '@/services';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; session: Session };

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    // Fires INITIAL_SESSION immediately with the persisted session (or null), then on every change.
    // Keep the callback synchronous: awaiting other supabase calls inside it can deadlock the auth lock.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: 'signedIn', session } : { status: 'signedOut' });
    });
    return () => subscription.unsubscribe();
  }, []);

  return state;
}
