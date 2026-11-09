/**
 * Small pieces of UI state that must survive an app restart.
 *
 * Zustand + AsyncStorage is enough here: today that is just the theme choice,
 * later it will also hold the evening-review time and reminder toggles.
 * Anything that belongs to the database lives in Supabase, not here.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

type PreferencesState = {
  /** "system" follows the OS setting; the other two force a palette. */
  themeMode: ThemeMode;
  /** True once the saved preferences have been read from storage. */
  hasHydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setHasHydrated: (value: boolean) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      hasHydrated: false,
      setThemeMode: (themeMode) => set({ themeMode }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'pace.preferences.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist real user choices, never transient flags.
      partialize: (state) => ({ themeMode: state.themeMode }),
      // Runs after a successful read *and* after a failed one, so the app is
      // never stuck on the splash screen because storage was unavailable.
      onRehydrateStorage: () => () => {
        usePreferences.setState({ hasHydrated: true });
      },
    },
  ),
);
