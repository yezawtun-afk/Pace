import { useEffect } from 'react';

import { useProfile } from '@/features/auth/use-profile';
import { usePreferences } from '@/lib/preferences';

/**
 * Keeps the local theme choice in step with the profile row.
 *
 * On profile load, a saved server choice (from another device) wins over
 * whatever this device remembered. One-directional on load so we never
 * clobber a choice the user just made.
 */
export function useThemeSync() {
  const profileQuery = useProfile();
  const setThemeMode = usePreferences((state) => state.setThemeMode);
  const themeMode = usePreferences((state) => state.themeMode);

  useEffect(() => {
    const serverTheme = profileQuery.data?.theme;
    if (serverTheme && serverTheme !== themeMode) {
      setThemeMode(serverTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data?.theme]);
}
