import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/auth/use-profile';
import { isSupabaseConfigured } from '@/lib/env';

/**
 * Entry route. Sends each visitor to the right place: setup help, sign in,
 * onboarding, or Today. The guards in the root layout also redirect, this just
 * gives `/` a sensible target.
 */
export default function Index() {
  const { session, isLoading } = useAuth();
  const profileQuery = useProfile();

  if (!isSupabaseConfigured) {
    return <Redirect href="/setup-required" />;
  }

  if (isLoading) {
    // The root layout is still showing the loading screen behind this route.
    return null;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (profileQuery.isPending) {
    return null;
  }

  return <Redirect href={profileQuery.data?.onboarding_completed ? '/today' : '/onboarding'} />;
}
