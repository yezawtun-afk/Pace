import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { fetchProfile, updateProfile } from '@/features/auth/api';
import { profileKeys } from '@/features/auth/keys';
import type { ProfileUpdate } from '@/types/database';

/** The signed-in user's profile row (name, timezone, evening time, onboarding
 * flag). Disabled while signed out so it never fires for anonymous visitors. */
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

/** Writes a patch to the profile and refreshes the cached row. */
export function useUpdateProfile() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: (patch: ProfileUpdate) => updateProfile(userId as string, patch),
    onSuccess: (updated) => {
      if (userId) {
        queryClient.setQueryData(profileKeys.detail(userId), updated);
      }
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
