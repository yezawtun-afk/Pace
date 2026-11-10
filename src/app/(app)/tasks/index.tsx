import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PlusIcon, TasksIcon } from '@/components/ui/icons';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { AppText } from '@/components/ui/text';
import { Space, Radius } from '@/constants/theme';
import { QuickAdd, defaultDueDateFor } from '@/features/tasks/components/quick-add';
import { TaskEditor } from '@/features/tasks/components/task-editor';
import { TaskRow } from '@/features/tasks/components/task-row';
import { groupTasks, type TaskView } from '@/features/tasks/grouping';
import { useCategories, useSetTaskCompleted, useTasks } from '@/features/tasks/queries';
import { useTheme } from '@/lib/use-theme';
import type { Category, Task } from '@/types/database';

const FILTERS: { value: TaskView; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'all', label: 'All' },
  { value: 'done', label: 'Done' },
];

const SUBTITLE: Record<TaskView, string> = {
  today: 'Due today, plus anything still overdue.',
  upcoming: 'Later days, grouped by date.',
  all: 'Everything still open, dated or not.',
  done: 'The last 100 tasks you finished.',
};

const PLACEHOLDER: Record<TaskView, string> = {
  today: 'Add a task for today',
  upcoming: 'Add a task for tomorrow',
  all: 'Add a task, no date',
  done: '',
};

const EMPTY_COPY: Record<TaskView, { title: string; message: string }> = {
  today: {
    title: 'Nothing due today',
    message: 'Tasks due today appear here, together with anything that slipped past its date.',
  },
  upcoming: {
    title: 'Nothing scheduled ahead',
    message: 'Future tasks are grouped by date so you can see the week without opening a calendar.',
  },
  all: {
    title: 'No open tasks',
    message: 'Every task you add shows up here. Priorities run from P1 (urgent) to P4 (someday).',
  },
  done: {
    title: 'Nothing completed yet',
    message: 'Finished tasks collect here so you can see what you actually got done.',
  },
};

/**
 * The task list. Four views over one table, a one-line quick add, and a sheet
 * for the details (date, time, priority, category, notes).
 */
export default function TasksScreen() {
  const { colors } = useTheme();
  const [view, setView] = useState<TaskView>('today');
  const [editor, setEditor] = useState<{ task: Task | null; defaultDate: string | null } | null>(
    null,
  );

  const tasksQuery = useTasks(view);
  const categoriesQuery = useCategories();
  const setCompleted = useSetTaskCompleted();

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categoriesQuery.data ?? []) {
      map.set(category.id, category);
    }
    return map;
  }, [categoriesQuery.data]);

  const tasks = tasksQuery.data ?? [];
  const groups = groupTasks(view, tasks);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={tasksQuery.isRefetching}
          onRefresh={() => void tasksQuery.refetch()}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }>
      <ScreenHeader
        eyebrow="Plan"
        title="Tasks"
        subtitle={SUBTITLE[view]}
        action={
          <Pressable
            onPress={() => setEditor({ task: null, defaultDate: defaultDueDateFor(view) })}
            accessibilityRole="button"
            accessibilityLabel="New task"
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

      <SegmentedControl
        accessibilityLabel="Filter tasks"
        options={FILTERS}
        value={view}
        onChange={setView}
      />

      {view !== 'done' ? (
        <View style={{ marginTop: Space.lg }}>
          <QuickAdd placeholder={PLACEHOLDER[view]} dueDate={defaultDueDateFor(view)} />
        </View>
      ) : null}

      {tasksQuery.isPending ? (
        <View style={{ paddingVertical: Space.huge, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : tasksQuery.isError ? (
        <View style={{ marginTop: Space.lg }}>
          <ErrorState
            message="Your tasks could not be loaded. This is usually a connection problem."
            onRetry={() => void tasksQuery.refetch()}
          />
        </View>
      ) : groups.length === 0 ? (
        <View style={{ marginTop: Space.lg }}>
          <EmptyState
            icon={<TasksIcon size={20} color={colors.textTertiary} />}
            title={EMPTY_COPY[view].title}
            message={EMPTY_COPY[view].message}
          />
        </View>
      ) : (
        groups.map((group, groupIndex) => (
          <View key={group.key} style={{ marginTop: groupIndex === 0 ? Space.xl : Space.lg }}>
            {group.title ? (
              <SectionHeader
                title={group.title}
                count={group.tasks.length}
                style={group.overdue ? { marginBottom: Space.sm } : undefined}
              />
            ) : null}

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
                  onOpen={() => setEditor({ task, defaultDate: task.due_date })}
                />
              ))}
            </Card>
          </View>
        ))
      )}

      {editor ? (
        <TaskEditor
          visible
          task={editor.task}
          defaultDate={editor.defaultDate}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </Screen>
  );
}
