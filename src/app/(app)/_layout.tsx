import { Stack } from 'expo-router';

import { colors, fonts } from '@/constants/theme';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function AppLayout() {
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
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="dogs/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="health/vaccination" options={{ presentation: 'modal' }} />
      <Stack.Screen name="health/note" options={{ presentation: 'modal' }} />
      <Stack.Screen name="health/food" options={{ presentation: 'modal' }} />
      <Stack.Screen name="advisor-context" options={{ presentation: 'modal', title: 'מה היועץ יודע' }} />
    </Stack>
  );
}
