import { Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold, useFonts } from '@expo-google-fonts/heebo';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfigErrorScreen } from '@/components/ConfigErrorScreen';
import { ToastHost } from '@/components/ui';
import { supabaseEnvResult } from '@/config/env';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { CookieBanner } from '@/features/legal/components';
import { queryClient } from '@/lib/queryClient';
import { configureRtl, configureWebDocument } from '@/navigation/platformSetup';
import { RootNavigator } from '@/navigation/RootNavigator';

void SplashScreen.preventAutoHideAsync();
configureRtl();
configureWebDocument();

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
          <StatusBar style="light" />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
