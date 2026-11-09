import { Redirect } from 'expo-router';

import { isSupabaseConfigured } from '@/lib/env';

/**
 * Entry route. Once auth exists (phase 2) this becomes the place that decides:
 * signed in -> Today, signed out -> Sign in, missing env -> Setup help.
 */
export default function Index() {
  if (!isSupabaseConfigured) {
    return <Redirect href="/setup-required" />;
  }

  return <Redirect href="/today" />;
}
