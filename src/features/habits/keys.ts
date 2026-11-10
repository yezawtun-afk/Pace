/** TanStack Query keys for habits and their logs. */

export const habitKeys = {
  all: ['habits'] as const,
  list: () => [...habitKeys.all, 'list'] as const,
  /** One entry for the whole log window, so the heatmap and stats share it. */
  logs: () => [...habitKeys.all, 'logs'] as const,
};
