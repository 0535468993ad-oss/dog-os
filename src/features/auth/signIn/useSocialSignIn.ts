import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { Feedback } from '@/components/ui';
import { reportError } from '@/utils/errors';

import { signInWithAppleNative, signInWithProvider } from '../api';
import { socialButtons, type SocialButton, type SocialProvider } from './socialLogic';

const NETWORK_ERROR = 'אין חיבור כרגע. בדקו את האינטרנט ונסו שוב.';

/** Google and Apple sign-in for the sign-in screen: which buttons to show, which one is busy, and the failure to announce. */
export function useSocialSignIn() {
  const [appleNative, setAppleNative] = useState(false);
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (alive) setAppleNative(available);
      })
      // Without the system sheet Apple still works through the browser flow.
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const start = async (button: SocialButton) => {
    if (busy) return;
    setBusy(button.provider);
    setFeedback(null);
    try {
      const result = button.method === 'native' ? await signInWithAppleNative() : await signInWithProvider(button.provider);
      // Success needs no message: the auth state change routes the user on. Cancelling is not an error.
      if (!result.ok) setFeedback({ kind: 'error', text: result.message });
    } catch (error) {
      reportError(error, 'socialSignIn');
      setFeedback({ kind: 'error', text: NETWORK_ERROR });
    } finally {
      setBusy(null);
    }
  };

  return { buttons: socialButtons(Platform.OS, appleNative), busy, feedback, start };
}
