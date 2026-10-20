import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

import { createSessionFromUrl, signOut } from './api';

export const LAST_ACTIVE_KEY = 'dogos-last-active';
/** Signed-in devices that haven't opened the app for this long are signed out. */
export const INACTIVITY_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Session timeout for inactive accounts. Supabase refresh tokens don't expire on their own, so the app
 * records when it was last in the foreground and signs out a device that was idle past the limit.
 */
export function useInactivityTimeout(signedIn: boolean) {
  useEffect(() => {
    if (!signedIn) return;

    const check = async () => {
      try {
        const raw = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
        const last = raw ? Number(raw) : NaN;
        if (Number.isFinite(last) && Date.now() - last > INACTIVITY_LIMIT_MS) {
          await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
          await signOut();
          return;
        }
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
      } catch {
        // Storage unavailable (e.g. blocked in a private window): skip the check rather than lock the user out.
      }
    };

    void check();
    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') return;
      const onVisible = () => {
        if (document.visibilityState === 'visible') void check();
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => document.removeEventListener('visibilitychange', onVisible);
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => subscription.remove();
  }, [signedIn]);
}

/**
 * Email links (sign-up confirmation, password recovery). Native: turns the tokens in the deep link into
 * a session. Both platforms: a recovery link opens the set-password screen.
 */
export function useAuthDeepLinks() {
  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (Platform.OS === 'web' || !url) return;
    void createSessionFromUrl(url).then((type) => {
      if (type === 'recovery') router.navigate('/account/password');
    });
  }, [url]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Defer: navigation must not run inside the auth callback (and the navigator may still be mounting).
      if (event === 'PASSWORD_RECOVERY') setTimeout(() => router.navigate('/account/password'), 0);
    });
    return () => subscription.unsubscribe();
  }, []);
}
