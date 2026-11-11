import { useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { categoryKeys, taskKeys } from '@/features/tasks/keys';
import { habitKeys } from '@/features/habits/keys';
import { journalKeys } from '@/features/journal/keys';
import { profileKeys } from '@/features/auth/keys';
import { supabase } from '@/lib/supabase';

/**
 * Subscribes to Supabase Realtime for the signed-in user's rows.
 *
 * Whenever any of their tasks, habits, logs, journal entries, tags or profile
 * change on another device (or in another tab), the matching TanStack Query
 * cache is invalidated so the UI re-fetches. This keeps every device in sync
 * without polling.
 *
 * Realtime must be enabled for the tables in the Supabase dashboard
 * (Database → Replication). If it is not, the subscription silently does
 * nothing and the app still works with manual refresh.
 */
export function useRealtimeSync() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`pace:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: habitKeys.all }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_logs', filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: habitKeys.all }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries', filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: journalKeys.all }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tags', filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: journalKeys.all }),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entry_tags',
          filter: `user_id=eq.${userId}`,
        },
        () => void queryClient.invalidateQueries({ queryKey: journalKeys.all }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
