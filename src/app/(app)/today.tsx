import { format } from 'date-fns';
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, View } from 'react-native';

import { TextLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { HabitsIcon, MoonIcon, TasksIcon } from '@/components/ui/icons';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useProfile } from '@/features/auth/use-profile';
import { useHabitLogs, useHabits, useToggleHabitDay } from '@/features/habits/queries';
import { QuickAdd } from '@/features/tasks/components/quick-add';
import { TaskEditor } from '@/features/tasks/components/task-editor';
import { TaskRow } from '@/features/tasks/components/task-row';
import { groupTasks, todayString } from '@/features/tasks/grouping';
import { useCategories, useSetTaskCompleted, useTasks } from '@/features/tasks/queries';
import { TodayHabitRow } from '@/features/today/components/today-habit-row';
import { greetingFor, greetingName, habitsForToday, todayProgress } from '@/features/today/summary';
import { useTheme } from '@/lib/use-theme';
import type { Category, Task } from '@/types/database';

/** Shared so habits without a log this month do not allocate a new Set each render. */
const NO_LOGS: Set<string> = new Set();

/**
 * The home screen: habits due today, tasks due or overdue, and one progress
 * ring that answers "how is today going?" without reading a single number.
 *
 * Nothing here is stored separately — Today is a view over the habits and tasks
 * you already have, so checking something off here checks it off everywhere.
 */
export default function TodayScreen() {
  const { colors } = useTheme();

  const profileQuery = useProfile();
  const habitsQuery = useHabits();
  const logsQuery = useHabitLogs();
  const tasksQuery = useTasks('today');
  const categoriesQuery = useCategories();

  const toggleHabitDay = useToggleHabitDay();
  const setCompleted = useSetTaskCompleted();

  /** The task sheet, if one is open. Sheets mount only while open. */
  const [editor, setEditor] = useState<{ task: Task } | null>(null);

  const today = new Date();
  const todayKey = todayString(today);

  /** Logs arrive flat, so group them once per fetch instead of per row. */
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

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categoriesQuery.data ?? []) {
      map.set(category.id, category);
    }
    return map;
  }, [categoriesQuery.data]);

  const habitRows = habitsForToday(habitsQuery.data ?? [], doneByHabit, today);
  const tasks = tasksQuery.data ?? [];
  const groups = groupTasks('today', tasks, today);
  const progress = todayProgress(habitRows, tasks);

  const name = greetingName(profileQuery.data?.display_name);
  const greeting = greetingFor(today);

  const habitsLoading = habitsQuery.isPending || logsQuery.isPending;
  const habitsFailed = habitsQuery.isError || logsQuery.isError;

  /**
   * Until both lists have arrived the counts are only half true, so the summary
   * card says "loading" instead of briefly claiming the day is finished.
   */
  const summaryLoading = habitsLoading || tasksQuery.isPending;

  function refresh() {
    void habitsQuery.refetch();
    void logsQuery.refetch();
    void tasksQuery.refetch();
    void categoriesQuery.refetch();
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={habitsQuery.isRefetching || logsQuery.isRefetching || tasksQuery.isRefetching}
          onRefresh={refresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }>
      <ScreenHeader
        eyebrow={format(today, 'EEEE d MMMM')}
        title={name ? `${greeting}, ${name}` : greeting}
        subtitle={
          summaryLoading
            ? 'Everything for today, in one calm place.'
            : subtitleFor(progress.remaining, progress.total)
        }
        action={
          <Pressable
            onPress={() => router.push('/journal/review')}
            accessibilityRole="button"
            accessibilityLabel="Start the evening review"
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
            <MoonIcon size={15} color={colors.accent} />
            <AppText variant="smallStrong" color={colors.accent}>
              Review
            </AppText>
          </Pressable>
        }
      />

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.xl }}>
          <ProgressRing
            value={summaryLoading ? 0 : progress.ratio}
            size={88}
            accessibilityLabel={
              summaryLoading
                ? 'Loading today'
                : `${progress.done} of ${progress.total} items completed today`
            }>
            <AppText variant="heading">
              {summaryLoading ? '—' : `${progress.done}/${progress.total}`}
            </AppText>
            <AppText variant="caption" tone="tertiary">
              done
            </AppText>
          </ProgressRing>

          <View style={{ flex: 1, gap: Space.xs + 2 }}>
            <AppText variant="bodyStrong">
              {summaryLoading
                ? 'Getting today ready'
                : headlineFor(progress.remaining, progress.total)}
            </AppText>
            <AppText variant="small" tone="secondary">
              {summaryLoading
                ? 'Your habits and tasks are on the way.'
                : progress.total === 0
                  ? 'A habit or a task is all it takes to start.'
                  : countsFor(progress)}
            </AppText>
          </View>
        </View>
      </Card>

      <View style={{ marginTop: Space.xxxl }}>
        <SectionHeader
          title="Habits"
          count={habitsLoading ? undefined : habitRows.length}
          action={<TextLink label="All habits" onPress={() => router.navigate('/habits')} />}
        />

        {habitsLoading ? (
          <Loading />
        ) : habitsFailed ? (
          <ErrorState
            message="Your habits could not be loaded. This is usually a connection problem."
            onRetry={refresh}
          />
        ) : habitRows.length === 0 ? (
          <QuietNote
            icon={<HabitsIcon size={18} color={colors.textTertiary} />}
            title={(habitsQuery.data ?? []).length === 0 ? 'No habits yet' : 'Nothing due today'}
            message={
              (habitsQuery.data ?? []).length === 0
                ? 'Add a small practice in the Habits tab and it will wait for you here on the days it is due.'
                : 'Rest days are part of the practice. Anything you do today will still show up here.'
            }
          />
        ) : (
          <Card padded={false}>
            {habitRows.map((entry, index) => (
              <TodayHabitRow
                key={entry.habit.id}
                entry={entry}
                done={doneByHabit.get(entry.habit.id) ?? NO_LOGS}
                today={today}
                last={index === habitRows.length - 1}
                onToggle={() =>
                  toggleHabitDay.mutate({
                    habitId: entry.habit.id,
                    date: todayKey,
                    done: !entry.done,
                  })
                }
                onOpen={() => router.navigate('/habits')}
              />
            ))}
          </Card>
        )}
      </View>

      <View style={{ marginTop: Space.xxl }}>
        <SectionHeader
          title="Tasks"
          count={tasksQuery.isPending ? undefined : tasks.length}
          action={<TextLink label="All tasks" onPress={() => router.navigate('/tasks')} />}
        />

        <QuickAdd placeholder="Add a task for today" dueDate={todayKey} />

        {tasksQuery.isPending ? (
          <Loading />
        ) : tasksQuery.isError ? (
          <ErrorState
            message="Your tasks could not be loaded. This is usually a connection problem."
            onRetry={refresh}
          />
        ) : groups.length === 0 ? (
          <QuietNote
            icon={<TasksIcon size={18} color={colors.textTertiary} />}
            title="Nothing due today"
            message="Tasks due today — and anything overdue — will wait here. Completing one takes a single tap."
          />
        ) : (
          groups.map((group) => (
            <View key={group.key} style={{ marginTop: Space.lg }}>
              <SectionHeader
                title={group.title}
                count={group.tasks.length}
                style={{ marginBottom: Space.sm }}
              />

              <Card padded={false}>
                {group.tasks.map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    category={task.category_id ? categoriesById.get(task.category_id) : undefined}
                    last={index === group.tasks.length - 1}
                    onToggle={() =>
                      setCompleted.mutate({ taskId: task.id, completed: !task.completed })
                    }
                    onOpen={() => setEditor({ task })}
                  />
                ))}
              </Card>
            </View>
          ))
        )}
      </View>

      {editor ? (
        <TaskEditor
          visible
          task={editor.task}
          defaultDate={editor.task.due_date ?? todayKey}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </Screen>
  );
}

/** The line under the greeting. Always true, never scolding. */
function subtitleFor(remaining: number, total: number): string {
  if (total === 0) return 'Everything for today, in one calm place.';
  if (remaining === 0) return 'Everything on your list is done. Enjoy the quiet.';
  if (remaining === 1) return 'One thing left for today.';
  return `${remaining} things left for today.`;
}

/** The headline next to the ring. */
function headlineFor(remaining: number, total: number): string {
  if (total === 0) return 'Nothing scheduled yet';
  if (remaining === 0) return 'All done for today';
  return `${remaining} left today`;
}

/** "Habits 1/3 · Tasks 0/2", skipping a list with nothing in it. */
function countsFor(progress: ReturnType<typeof todayProgress>): string {
  const parts: string[] = [];

  if (progress.habitTotal > 0) {
    parts.push(`Habits ${progress.habitDone}/${progress.habitTotal}`);
  }
  if (progress.taskTotal > 0) {
    parts.push(`Tasks ${progress.taskDone}/${progress.taskTotal}`);
  }

  return parts.join(' · ');
}

/** Centered spinner for one section while its first fetch is in flight. */
function Loading() {
  const { colors } = useTheme();

  return (
    <View style={{ paddingVertical: Space.xxl, alignItems: 'center' }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

type QuietNoteProps = {
  icon: ReactNode;
  title: string;
  message: string;
};

/**
 * A small, calm "nothing here today" card. The full EmptyState is saved for
 * screens that are entirely empty, so a quiet day does not look like an error.
 */
function QuietNote({ icon, title, message }: QuietNoteProps) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
        {icon}
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="small" tone="secondary">
            {message}
          </AppText>
        </View>
      </View>
    </Card>
  );
}
