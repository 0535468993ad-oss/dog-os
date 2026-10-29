import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { DevSchemaWarning } from '@/components/DevSchemaWarning';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/api';
import { useAuthDeepLinks, useInactivityTimeout } from '@/features/auth/sessionGuards';
import { ConsentCheckFailed } from '@/features/legal/components';
import { useConsents } from '@/features/legal/hooks/consents';
import { consentGate } from '@/features/legal/utils/consentRules';
import { colors, fonts } from '@/constants/theme';

import { rootRouteState } from './routeState';

/** Root stack: guards each route group by auth and consent state, and hides the splash once settled. */
export function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const auth = useAuth();
  const consents = useConsents(auth.status === 'signedIn' ? auth.user.id : null);
  const route = rootRouteState(fontsReady, auth.status, consentGate(consents));

  useAuthDeepLinks();
  useInactivityTimeout(route.signedIn);

  useEffect(() => {
    if (!route.loading) void SplashScreen.hideAsync();
  }, [route.loading]);

  if (route.loading) return null;
  if (route.consentCheckFailed) return <ConsentCheckFailed onRetry={() => void consents.refetch()} onSignOut={() => void signOut()} />;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: fonts.extrabold },
          headerTintColor: colors.primary,
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Protected guard={route.signedIn && !route.needsConsent}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={route.needsConsent}>
          <Stack.Screen name="consent" />
        </Stack.Protected>
        <Stack.Protected guard={!route.signedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        {/* Any signed-in session, including a password-recovery one before consents are checked. */}
        <Stack.Protected guard={route.signedIn}>
          <Stack.Screen name="account/password" />
        </Stack.Protected>
        {/* Legal documents are public: reachable from sign-up, the footer and settings. */}
        <Stack.Screen name="legal/[doc]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'הדף לא נמצא' }} />
      </Stack>
      {route.devBypassReason ? <DevSchemaWarning reason={route.devBypassReason} /> : null}
    </>
  );
}
