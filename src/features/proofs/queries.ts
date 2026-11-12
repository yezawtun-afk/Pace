import { useQuery } from '@tanstack/react-query';

import { getProofSignedUrl } from './api';

export const proofKeys = {
  url: (path: string) => ['proofs', 'url', path] as const,
};

/**
 * Resolves a stored proof path to a short-lived signed URL.
 *
 * The URL is cached for 50 minutes (links last 60) and shared across screens by
 * React Query, so a photo shown on Today and in the journal is fetched once.
 */
export function useProofUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: proofKeys.url(path ?? 'none'),
    queryFn: () => getProofSignedUrl(path as string),
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
