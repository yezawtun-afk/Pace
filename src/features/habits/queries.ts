/**
 * TanStack Query hooks for habits.
 *
 * Checking a habit off is optimistic: the cached log list changes before the
 * request leaves, and is put back exactly as it was if the server refuses.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import type { HabitLog } from '@/types/database';

import {
  createHabit,
  deleteHabit,
  fetchHabitLogs,
  fetchHabits,
  setHabitDone,
  updateHabit,
  type HabitDraft,
} from './api';
import { habitKeys } from './keys';

export function useHabits() {
  const { session } = useAuth();

  return useQuery({
    queryKey: habitKeys.list(),
    queryFn: fetchHabits,
    enabled: Boolean(session?.user.id),
    staleTime: 60_000,
  });
}

export function useHabitLogs() {
  const { session } = useAuth();

  return useQuery({
    queryKey: habitKeys.logs(),
    queryFn: fetchHabitLogs,
    enabled: Boolean(session?.user.id),
    staleTime: 60_000,
  });
}

export function useCreateHabit() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: HabitDraft) => createHabit(session?.user.id as string, draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.list() });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: HabitDraft }) => updateHabit(id, draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.list() });
      // The schedule decides which days count, so the stats change too.
      void queryClient.invalidateQueries({ queryKey: habitKeys.logs() });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.list() });
      void queryClient.invalidateQueries({ queryKey: habitKeys.logs() });
    },
  });
}

export type ToggleHabitInput = {
  habitId: string;
  /** "yyyy-MM-dd" — today for the list, any past day when back-filling. */
  date: string;
  done: boolean;
};

export function useToggleHabitDay() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, date, done }: ToggleHabitInput) =>
      setHabitDone(session?.user.id as string, habitId, date, done),

    onMutate: async ({ habitId, date, done }) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.logs() });

      const previous = queryClient.getQueryData<HabitLog[]>(habitKeys.logs());

      queryClient.setQueryData<HabitLog[]>(habitKeys.logs(), (logs) => {
        const rows = logs ?? [];
        const without = rows.filter((log) => !(log.habit_id === habitId && log.log_date === date));

        if (!done) return without;

        return [
          {
            // Temporary id; the real row arrives with the refetch.
            id: `optimistic-${habitId}-${date}`,
            habit_id: habitId,
            user_id: session?.user.id as string,
            log_date: date,
            completed: true,
            proof_path: null,
            created_at: new Date().toISOString(),
          },
          ...without,
        ];
      });

      return { previous };
    },

    onError: (_error, _input, context) => {
      queryClient.setQueryData(habitKeys.logs(), context?.previous);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.logs() });
    },
  });
}
