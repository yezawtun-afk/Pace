import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { fetchProfile } from '@/features/auth/api';
import { profileKeys } from '@/features/auth/keys';

/**
 * The signed-in user's profile row (name, timezone, evening time, onboarding
 * flag). Disabled while signed out so it never fires for anonymous visitors.
 */
export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: profileKeys.detail(userId ?? 'anonymous'),
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}
