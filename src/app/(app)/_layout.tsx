import { Stack } from 'expo-router';

import { LoadingState } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useOnboardingRoute } from '@/features/onboarding/hooks/useOnboarding';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function AppLayout() {
  // First run: the diagnostic onboarding comes before the tabs (skippable; fails open on errors).
  const route = useOnboardingRoute();
  if (route === 'LOADING') return <LoadingState />;
  const onboarding = route === 'ONBOARDING';

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: fonts.bold },
        headerTintColor: colors.primary,
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      {/*
        Explicit redirects: without them a denied guard falls back to the first available screen, which
        is an arbitrary secondary route (it landed on the report, with no tab bar). Finishing or skipping
        onboarding denies "onboarding" and goes to "/"; an owner not yet onboarded is sent to the wizard.
      */}
      <Stack.Protected guard={onboarding} redirectTo="/">
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!onboarding} redirectTo="/onboarding">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="assessment" options={{ headerShown: false }} />
      <Stack.Screen name="dogs/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="health/vaccination" options={{ presentation: 'modal' }} />
      <Stack.Screen name="health/note" options={{ presentation: 'modal' }} />
      <Stack.Screen name="health/food" options={{ presentation: 'modal' }} />
      <Stack.Screen name="advisor-context" options={{ presentation: 'modal', title: 'מה היועץ יודע' }} />
    </Stack>
  );
}
