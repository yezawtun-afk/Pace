/** TanStack Query keys for tasks and categories, in one place to avoid typos. */

export const taskKeys = {
  all: ['tasks'] as const,
  /** One cache entry per view, so switching views is instant after the first load. */
  list: (view: string) => [...taskKeys.all, 'list', view] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
};
