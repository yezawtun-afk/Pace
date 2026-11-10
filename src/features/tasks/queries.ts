/**
 * TanStack Query hooks for tasks and categories.
 *
 * Screens call these hooks; they never call `api.ts` directly. Mutations keep
 * the cache honest: checking a task off updates every cached view immediately
 * and rolls back if the server refuses, so the checkbox never lies.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import type { Task } from '@/types/database';

import {
  createCategory,
  createTask,
  deleteCategory,
  deleteTask,
  fetchCategories,
  fetchTasks,
  setTaskCompleted,
  updateTask,
  type TaskDraft,
} from './api';
import type { TaskView } from './grouping';
import { categoryKeys, taskKeys } from './keys';

export function useTasks(view: TaskView) {
  const { session } = useAuth();

  return useQuery({
    queryKey: taskKeys.list(view),
    queryFn: () => fetchTasks(view),
    enabled: Boolean(session?.user.id),
    staleTime: 15_000,
  });
}

export function useCategories() {
  const { session } = useAuth();

  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: fetchCategories,
    enabled: Boolean(session?.user.id),
    staleTime: 5 * 60_000,
  });
}

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: taskKeys.all });
}

export function useCreateTask() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: TaskDraft) => createTask(session?.user.id as string, draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: TaskDraft }) => updateTask(id, draft),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => void invalidate(),
  });
}

type ToggleInput = { taskId: string; completed: boolean };

/**
 * Checking a box feels instant: every cached list is patched before the request
 * leaves, and put back exactly as it was if the request fails.
 */
export function useSetTaskCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, completed }: ToggleInput) => setTaskCompleted(taskId, completed),

    onMutate: async ({ taskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      const previous = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
      const completedAt = completed ? new Date().toISOString() : null;

      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (tasks) =>
        tasks?.map((task) =>
          task.id === taskId ? { ...task, completed, completed_at: completedAt } : task,
        ),
      );

      return { previous };
    },

    onError: (_error, _input, context) => {
      for (const [key, data] of context?.previous ?? []) {
        queryClient.setQueryData(key, data);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useCreateCategory() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createCategory(session?.user.id as string, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      // Task rows show their category name, so both caches change.
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
