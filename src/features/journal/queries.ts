/**
 * TanStack Query hooks for the journal.
 *
 * The list, the tags and the links are three small queries. Saving an entry
 * invalidates the list so the history and the "written today" state stay true.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';

import {
  deleteEntry,
  fetchEntries,
  fetchEntryTags,
  fetchTags,
  findOrCreateTag,
  saveEntry,
  setEntryTags,
  type EntryDraft,
} from './api';
import { journalKeys } from './keys';

export function useJournalEntries() {
  const { session } = useAuth();

  return useQuery({
    queryKey: journalKeys.entries(),
    queryFn: fetchEntries,
    enabled: Boolean(session?.user.id),
    staleTime: 60_000,
  });
}

export function useJournalTags() {
  const { session } = useAuth();

  return useQuery({
    queryKey: journalKeys.tags(),
    queryFn: fetchTags,
    enabled: Boolean(session?.user.id),
    staleTime: 5 * 60_000,
  });
}

export function useJournalEntryTags() {
  const { session } = useAuth();

  return useQuery({
    queryKey: journalKeys.entryTags(),
    queryFn: fetchEntryTags,
    enabled: Boolean(session?.user.id),
    staleTime: 60_000,
  });
}

/** Creates or overwrites the entry for its day and returns the saved row. */
export function useSaveEntry() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: EntryDraft) => saveEntry(session?.user.id as string, draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: journalKeys.entries() });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: journalKeys.entries() });
      void queryClient.invalidateQueries({ queryKey: journalKeys.entryTags() });
    },
  });
}

export function useSetEntryTags() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, tagIds }: { entryId: string; tagIds: string[] }) =>
      setEntryTags(session?.user.id as string, entryId, tagIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: journalKeys.entryTags() });
    },
  });
}

export function useCreateTag() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => findOrCreateTag(session?.user.id as string, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: journalKeys.tags() });
    },
  });
}
