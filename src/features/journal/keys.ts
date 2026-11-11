import type { JournalEntry, Tag } from '@/types/database';

/**
 * TanStack Query keys for the journal.
 *
 * One shared `all` key means a single invalidate call refreshes the list, the
 * tags and the links between them, so the UI never shows a half-saved entry.
 */
export const journalKeys = {
  all: ['journal'] as const,
  entries: () => [...journalKeys.all, 'entries'] as const,
  tags: () => [...journalKeys.all, 'tags'] as const,
  entryTags: () => [...journalKeys.all, 'entry-tags'] as const,
};

export type { JournalEntry, Tag };
