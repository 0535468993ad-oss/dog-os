import { Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold, useFonts } from '@expo-google-fonts/heebo';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfigErrorScreen } from '@/components/ConfigErrorScreen';
import { DevSchemaWarning } from '@/components/DevSchemaWarning';
import { Button, ErrorState, Screen, ToastHost } from '@/components/ui';
import { supabaseEnvResult } from '@/config/env';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/api';
import { useAuthDeepLinks, useInactivityTimeout } from '@/features/auth/sessionGuards';
import { CookieBanner } from '@/features/legal/components';
import { consentGate, useConsents } from '@/features/legal/consents';
import { queryClient } from '@/lib/queryClient';
import { colors, fonts } from '@/theme';

void SplashScreen.preventAutoHideAsync();

// Hebrew-only app. Builds get RTL from the expo-localization plugin; this covers Expo Go and the first
// launch (native direction changes apply after the next app start).
if (Platform.OS !== 'web' && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// Web: document direction/language for screen readers and CSS logical properties, plus a clearly visible
// keyboard focus indicator (WCAG 2.4.7).
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'he';
  const style = document.createElement('style');
  style.textContent = `:focus-visible { outline: 3px solid ${colors.focus} !important; outline-offset: 2px; border-radius: 6px; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`;
  document.head.appendChild(style);
}

export const unstable_settings = {
  anchor: '(app)',
};

// Render crashes anywhere below the root (including the providers) land here; screens have their own.
export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold });

  useEffect(() => {
    if (!supabaseEnvResult.ok) void SplashScreen.hideAsync();
  }, []);

  if (!supabaseEnvResult.ok) return <ConfigErrorScreen details={supabaseEnvResult.error.message} />;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator fontsReady={fontsLoaded || !!fontError} />
          <CookieBanner />
          <ToastHost />
          <StatusBar style="dark" />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const auth = useAuth();
  const userId = auth.status === 'signedIn' ? auth.user.id : null;
  const consents = useConsents(userId);

  const signedIn = auth.status === 'signedIn';
  const gate = consentGate(consents);
  const loading = !fontsReady || auth.status === 'loading' || (signedIn && gate.state === 'loading');
  const needsConsent = signedIn && gate.state === 'required';

  useAuthDeepLinks();
  useInactivityTimeout(signedIn);

  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;
  if (signedIn && gate.state === 'error') return <ConsentCheckFailed onRetry={() => void consents.refetch()} />;

  return (
    <>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: fonts.bold },
        headerTintColor: colors.primary,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={signedIn && !needsConsent}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && needsConsent}>
        <Stack.Screen name="consent" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      {/* Any signed-in session, including a password-recovery one before consents are checked. */}
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="account/password" />
      </Stack.Protected>
      {/* Legal documents are public: reachable from sign-up, the footer and settings. */}
      <Stack.Screen name="legal/[doc]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'הדף לא נמצא' }} />
    </Stack>
    {signedIn && gate.state === 'bypassed_dev' ? <DevSchemaWarning reason={gate.reason} /> : null}
    </>
  );
}

/** Consent couldn't be verified: hold the user here (fail closed) with a retry and a way out. */
function ConsentCheckFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <Screen>
      <ErrorState message="לא הצלחנו לאמת את הגדרות הפרטיות שלכם. בדקו את החיבור ונסו שוב." onRetry={onRetry} />
      <Button title="יציאה מהחשבון" variant="ghost" onPress={() => void signOut()} />
    </Screen>
  );
}
