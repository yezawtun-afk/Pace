/**
 * The single source of truth for "which palette am I in?".
 *
 * Resolution order: a manual override from preferences, otherwise the OS
 * setting. Screens read colours through this hook only, never directly from
 * `Colors`, so a theme switch repaints the whole app.
 */

import { Colors, Layout, Radius, Space, Type, type ColorSchemeName } from '@/constants/theme';
import { usePreferences } from '@/lib/preferences';
import { useColorScheme } from '@/lib/use-color-scheme';

export function useTheme() {
  const themeMode = usePreferences((state) => state.themeMode);
  const systemScheme = useColorScheme();

  const scheme: ColorSchemeName =
    themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;

  return {
    scheme,
    isDark: scheme === 'dark',
    themeMode,
    colors: Colors[scheme],
    space: Space,
    radius: Radius,
    type: Type,
    layout: Layout,
  };
}

export type Theme = ReturnType<typeof useTheme>;
