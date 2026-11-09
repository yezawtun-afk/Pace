/** TanStack Query keys for the auth area, kept in one place to avoid typos. */
export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
};
