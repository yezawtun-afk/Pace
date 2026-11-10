import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AppText } from '@/components/ui/text';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/auth/use-profile';
import { isSupabaseConfigured } from '@/lib/env';
import { queryClient } from '@/lib/query-client';
import { usePreferences } from '@/lib/preferences';
import { useTheme } from '@/lib/use-theme';

// Keep the native splash up until the theme and the session have been read, so
// the first visible frame is already correct.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 250, fade: true });

/** Safety net so a broken storage read can never trap the user on the splash. */
const HYDRATION_TIMEOUT_MS = 600;

export default function RootLayout() {
  const hasHydrated = usePreferences((state) => state.hasHydrated);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!usePreferences.getState().hasHydrated) {
        usePreferences.getState().setHasHydrated(true);
      }
    }, HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!hasHydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/**
 * Decides which part of the app is reachable: the auth screens when signed out,
 * onboarding until it has been completed, and the main app after that.
 * `Stack.Protected` keeps the redirects declarative — no manual router calls to
 * get out of sync.
 */
function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { session, isLoading: isAuthLoading } = useAuth();
  const profileQuery = useProfile();

  const signedIn = Boolean(session);
  const onboardingCompleted = profileQuery.data?.onboarding_completed ?? false;

  // Where an unavailable screen should send the user, given the current state.
  const landing = !isSupabaseConfigured
    ? '/setup-required'
    : signedIn
      ? onboardingCompleted
        ? '/today'
        : '/onboarding'
      : '/sign-in';

  // Signed-out users do not need a profile; signed-in ones are ready once the
  // profile request has finished (successfully or not).
  const profileSettled = !signedIn || profileQuery.isSuccess || profileQuery.isError;
  const isReady = !isAuthLoading && profileSettled;

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

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

  if (isReady && signedIn && profileQuery.isError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 12,
          backgroundColor: colors.background,
        }}>
        <AppText variant="heading">Could not load your profile</AppText>
        <AppText variant="small" tone="secondary" style={{ textAlign: 'center', maxWidth: 320 }}>
          This is usually a connection problem. Check your internet and try again.
        </AppText>
        <Button
          label="Try again"
          onPress={() => void profileQuery.refetch()}
          style={{ marginTop: 8, alignSelf: 'center' }}
          fullWidth={false}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />

        <Stack.Protected guard={isSupabaseConfigured && !signedIn} redirectTo={landing}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected
          guard={isSupabaseConfigured && signedIn && !onboardingCompleted}
          redirectTo={landing}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>

        <Stack.Protected
          guard={isSupabaseConfigured && signedIn && onboardingCompleted}
          redirectTo={landing}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        {/* Reachable from an emailed recovery link, signed in or not. */}
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="setup-required" />
      </Stack>

      {!isReady ? (
        <View style={StyleSheet.absoluteFill}>
          <LoadingScreen />
        </View>
      ) : null}
    </View>
  );
}
