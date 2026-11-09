/**
 * One TanStack Query client for the whole app.
 *
 * Everything the app reads from Supabase goes through this cache, which gives
 * us instant screen switches, background refetches and quiet retries.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30s; screens still refetch when the user
      // pulls to refresh or when we tell them to after a mutation.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // A single quiet retry is enough; the UI already shows an error state.
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
