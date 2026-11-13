import { Redirect, Stack } from 'expo-router';

import { AppShell } from '@/components/app-shell';
import { isSupabaseConfigured } from '@/lib/env';
import { useTheme } from '@/lib/use-theme';
import { useThemeSync } from '@/lib/use-theme-sync';
import { useRealtimeSync } from '@/lib/realtime';

/**
 * The signed-in app. `AppShell` owns the navigation chrome (sidebar or bottom
 * tabs) and the `Stack` below it renders the current screen, so detail screens
 * can be pushed on top without losing the nav.
 */
export default function AppLayout() {
  const { colors } = useTheme();
  useThemeSync();
  useRealtimeSync();

  if (!isSupabaseConfigured) {
    return <Redirect href="/setup-required" />;
  }

  return (
    <AppShell>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="today" />
        <Stack.Screen name="habits/index" />
        <Stack.Screen name="journal/index" />
        <Stack.Screen name="journal/review" />
        <Stack.Screen name="seasons/review" />
        <Stack.Screen name="tasks/index" />
        <Stack.Screen name="settings/index" />
      </Stack>
    </AppShell>
  );
}
