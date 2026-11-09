/**
 * The Supabase client, shared by the whole app.
 *
 * Key points:
 * - `react-native-url-polyfill` must be imported before supabase-js on native
 *   (supabase-js uses `URL`, which React Native does not fully implement).
 * - The session is stored in AsyncStorage so the user stays signed in between
 *   launches.
 * - On native we pause the token auto-refresh while the app is in the
 *   background, as recommended by Supabase.
 */

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/env';

/**
 * When the environment is not configured we still create a client so the type
 * is never nullable. Every data call is behind a screen that is only reachable
 * when `isSupabaseConfigured` is true, so these placeholders are never used.
 */
const fallbackUrl = 'http://127.0.0.1:54321';
const fallbackKey = 'public-anon-key-placeholder';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // OAuth and password-reset links land on the web page with a code in the
      // URL, so only the web build should parse the URL automatically.
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'pkce',
    },
  },
);

if (Platform.OS !== 'web' && isSupabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
