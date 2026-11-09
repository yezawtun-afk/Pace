import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/query-client';
import { usePreferences } from '@/lib/preferences';
import { useTheme } from '@/lib/use-theme';

// Keep the native splash up until the saved theme has been read, then fade it
// out so the first painted frame is already the right colour.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 250, fade: true });

/** Safety net so a broken storage read can never trap the user on the splash. */
const HYDRATION_TIMEOUT_MS = 600;

export default function RootLayout() {
  const hasHydrated = usePreferences((state) => state.hasHydrated);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!usePreferences.getState().hasHydrated) {
        usePreferences.getState().setHasHydrated(true);
      }
    }, HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [hasHydrated]);

  // Paint the area behind the app (Android system bar, web page) in theme
  // colours so there is no white flash when scrolling or overscrolling.
  useEffect(() => {
    if (Platform.OS === 'android') {
      void SystemUI.setBackgroundColorAsync(colors.background);
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = colors.background;
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    }
  }, [colors.background, isDark]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
