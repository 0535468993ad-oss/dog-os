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
import { installGlobalErrorHandlers, markAppReady } from '@/lib/globalErrorHandler';
import { configureOnlineManager } from '@/lib/onlineStatus';
import { queryClient } from '@/lib/queryClient';
import { configureRtl, configureWebDocument } from '@/navigation/platformSetup';
import { RootNavigator } from '@/navigation/RootNavigator';

// First, so that errors anywhere after this point are reported instead of closing the app.
installGlobalErrorHandlers();
void SplashScreen.preventAutoHideAsync();
configureRtl();
configureWebDocument();
configureOnlineManager();

export const unstable_settings = {
  anchor: '(app)',
};

// Render crashes anywhere below the root (including the providers) land here; screens have their own.
export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold });

  useEffect(() => {
    markAppReady();
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
