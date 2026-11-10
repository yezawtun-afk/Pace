import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { HabitsIcon, PlusIcon } from '@/components/ui/icons';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { todayString } from '@/lib/dates';
import { useTheme } from '@/lib/use-theme';
import type { Habit } from '@/types/database';

import { HabitCard } from '@/features/habits/components/habit-card';
import { HabitDetail } from '@/features/habits/components/habit-detail';
import { HabitEditor } from '@/features/habits/components/habit-editor';
import {
  useDeleteHabit,
  useHabitLogs,
  useHabits,
  useToggleHabitDay,
} from '@/features/habits/queries';

/**
 * The habit library: every habit with today's check button, its streak and its
 * 30-day rate. Tapping a card opens the details; "New" creates one.
 */
export default function HabitsScreen() {
  const { colors } = useTheme();

  const habitsQuery = useHabits();
  const logsQuery = useHabitLogs();
  const toggleDay = useToggleHabitDay();
  const deleteHabit = useDeleteHabit();

  /** Which sheet is open, if any. Sheets mount only while open. */
  const [editor, setEditor] = useState<{ habit: Habit | null } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const habits = habitsQuery.data ?? [];

  /**
   * Logs arrive as one flat list, so group them once per fetch instead of
   * filtering the whole array for every card.
   */
  const doneByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();

    for (const log of logsQuery.data ?? []) {
      const existing = map.get(log.habit_id);
      if (existing) {
        existing.add(log.log_date);
      } else {
        map.set(log.habit_id, new Set([log.log_date]));
      }
    }

    return map;
  }, [logsQuery.data]);

  const loading = habitsQuery.isPending || logsQuery.isPending;
  const loadFailed = habitsQuery.isError || logsQuery.isError;

  const today = new Date();
  const todayKey = todayString();

  function refresh() {
    void habitsQuery.refetch();
    void logsQuery.refetch();
  }

  function toggle(habitId: string, date: string) {
    const done = doneByHabit.get(habitId)?.has(date) ?? false;
    toggleDay.mutate({ habitId, date, done: !done });
  }

  function openEditor(habit: Habit | null) {
    setDetailId(null);
    setDetailError(null);
    setEditor({ habit });
  }

  const detailHabit = detailId ? habits.find((habit) => habit.id === detailId) : undefined;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={habitsQuery.isRefetching || logsQuery.isRefetching}
          onRefresh={refresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }>
      <ScreenHeader
        eyebrow="Practice"
        title="Habits"
        subtitle="Small things, repeated daily. That is the whole trick."
        action={
          <Pressable
            onPress={() => openEditor(null)}
            accessibilityRole="button"
            accessibilityLabel="New habit"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: Space.xs + 1,
              minHeight: 44,
              paddingHorizontal: Space.md + 2,
              borderRadius: Radius.pill,
              backgroundColor: colors.surfaceMuted,
              opacity: pressed ? 0.7 : 1,
            })}>
            <PlusIcon size={15} color={colors.accent} />
            <AppText variant="smallStrong" color={colors.accent}>
              New
            </AppText>
          </Pressable>
        }
      />

      {loading ? (
        <View style={{ paddingVertical: Space.huge, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : loadFailed ? (
        <ErrorState
          message="Your habits could not be loaded. This is usually a connection problem."
          onRetry={refresh}
        />
      ) : habits.length === 0 ? (
        <EmptyState
          icon={<HabitsIcon size={20} color={colors.textTertiary} />}
          title="No habits yet"
          message="Add one small thing you want to repeat. Pace tracks the streak, the completion rate and a month heatmap, so you can see what is actually sticking."
          action={<Button label="Create your first habit" onPress={() => openEditor(null)} />}
        />
      ) : (
        <View style={{ gap: Space.md }}>
          {habits.map((habit) => {
            const done = doneByHabit.get(habit.id) ?? new Set<string>();

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                done={done}
                today={today}
                onToggleToday={() => toggle(habit.id, todayKey)}
                onOpen={() => {
                  setEditor(null);
                  setDetailError(null);
                  setDetailId(habit.id);
                }}
              />
            );
          })}
        </View>
      )}

      {editor ? <HabitEditor visible habit={editor.habit} onClose={() => setEditor(null)} /> : null}

      {detailHabit ? (
        <HabitDetail
          visible
          habit={detailHabit}
          done={doneByHabit.get(detailHabit.id) ?? new Set<string>()}
          today={today}
          onClose={() => setDetailId(null)}
          onEdit={() => openEditor(detailHabit)}
          onToggleDay={(date) => toggle(detailHabit.id, date)}
          onDelete={() => {
            deleteHabit.mutate(detailHabit.id, {
              onSuccess: () => setDetailId(null),
              onError: () => setDetailError('That habit could not be deleted. Try again.'),
            });
          }}
          deleting={deleteHabit.isPending}
          error={detailError}
        />
      ) : null}
    </Screen>
  );
}
