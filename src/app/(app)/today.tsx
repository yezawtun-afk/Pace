import { format } from 'date-fns';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, TextLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { HabitsIcon, MoonIcon, PlusIcon } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { AppText } from '@/components/ui/text';
import { Motion, Radius, Space } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/auth/use-profile';
import {
  useHabitLogs,
  useHabits,
  useSetHabitLogProof,
  useToggleHabitDay,
} from '@/features/habits/queries';
import { QuickAdd } from '@/features/tasks/components/quick-add';
import { TaskEditor } from '@/features/tasks/components/task-editor';
import { TaskRow } from '@/features/tasks/components/task-row';
import { groupTasks, todayString } from '@/features/tasks/grouping';
import { useCategories, useSetTaskCompleted, useTasks } from '@/features/tasks/queries';
import { TodayHabitRow } from '@/features/today/components/today-habit-row';
import { greetingFor, greetingName, habitsForToday, todayProgress } from '@/features/today/summary';
import { ProofThumbnail } from '@/features/proofs/components/proof-thumbnail';
import { buildProofPath } from '@/features/proofs/paths';
import {
  compressProof,
  deleteProof,
  ensureProofPermission,
  pickProofImage,
  uploadProof,
  getProofSignedUrl,
  MAX_PROOF_BYTES,
} from '@/features/proofs/api';

import { ReminderBanner } from '@/components/reminder-banner';
import { Sheet } from '@/components/ui/sheet';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { useTheme } from '@/lib/use-theme';
import { isWeb } from '@/lib/web';
import type { Category, Task } from '@/types/database';

const NO_LOGS = new Set<string>();

export default function TodayScreen() {
  const { colors } = useTheme();
  const today = useMemo(() => new Date(), []);

  const profileQuery = useProfile();
  const habitsQuery = useHabits();
  const logsQuery = useHabitLogs();
  const tasksQuery = useTasks('today');
  const categoriesQuery = useCategories();

  const toggleHabitDay = useToggleHabitDay();
  const setTaskCompleted = useSetTaskCompleted();

  const name = greetingName(profileQuery.data?.display_name ?? null);
  const greeting = greetingFor(today);

  const habitsLoading = habitsQuery.isPending || logsQuery.isPending;
  const tasksLoading = tasksQuery.isPending;
  const summaryLoading = habitsLoading || tasksLoading;

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

  const habitRows = useMemo(
    () => (habitsLoading ? [] : habitsForToday(habitsQuery.data ?? [], doneByHabit, today)),
    [habitsLoading, habitsQuery.data, doneByHabit, today],
  );

  const todayKey = todayString(today);

  /** Today's proof photo path per habit, for the row thumbnails. */
  const proofByHabit = useMemo(() => {
    const map = new Map<string, string>();

    for (const log of logsQuery.data ?? []) {
      if (log.log_date === todayKey && log.proof_path) map.set(log.habit_id, log.proof_path);
    }

    return map;
  }, [logsQuery.data, todayKey]);

  const taskRows = groupTasks('today', tasksQuery.data ?? [], today).flatMap(
    (group) => group.tasks,
  );

  const progress = todayProgress(habitRows, taskRows);

  const refresh = () => {
    void habitsQuery.refetch();
    void logsQuery.refetch();
    void tasksQuery.refetch();
    void categoriesQuery.refetch();
  };

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categoriesQuery.data ?? []) map.set(category.id, category);
    return map;
  }, [categoriesQuery.data]);

  const [editorTask, setEditorTask] = useState<Task | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const [proofHabit, setProofHabit] = useState<{ id: string; name: string } | null>(null);
  /** An older photo for the same day, deleted once the new one lands. */
  const [proofPreviousPath, setProofPreviousPath] = useState<string | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [proofUri, setProofUri] = useState<string | null>(null);
  /** The compressed file on the device, kept so a failed upload can be retried. */
  const [proofLocalUri, setProofLocalUri] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofDenied, setProofDenied] = useState(false);

  const { session } = useAuth();
  const setHabitLogProof = useSetHabitLogProof();
  const reducedMotion = useReducedMotion();

  // On a laptop: "n" starts a new task, "q" opens the quick entry box.
  useKeyboardShortcuts({
    n: () => setNewTaskOpen(true),
    q: () => setQuickAddOpen(true),
  });

  function closeProofSheet() {
    setProofHabit(null);
    setProofPreviousPath(null);
    setProofUri(null);
    setProofLocalUri(null);
    setProofError(null);
    setProofDenied(false);
  }

  /** Uploads an already-compressed file and attaches it to today's log. */
  async function uploadProofFor(habitId: string, localUri: string) {
    if (!session?.user.id) return;

    setProofUploading(true);
    setProofError(null);

    const previous = proofPreviousPath;

    try {
      const path = buildProofPath(session.user.id);
      await uploadProof(path, localUri);
      const url = await getProofSignedUrl(path);
      await setHabitLogProof.mutateAsync({ habitId, date: todayKey, proofPath: path });

      // One photo per check-off: the old object goes once the row points at the
      // new one. A failed cleanup only leaves an orphan file, never a broken row.
      if (previous) void deleteProof(previous).catch(() => {});

      setProofUri(url);
      successFeedback();
      closeProofSheet();
    } catch {
      // The check-off is already saved; only the photo is missing.
      setProofError('The photo did not upload. Your check-off is saved.');
    } finally {
      setProofUploading(false);
    }
  }

  /** Clears the photo for one habit and deletes the file behind it. */
  async function removeProofFor(habitId: string, path: string) {
    await setHabitLogProof.mutateAsync({ habitId, date: todayKey, proofPath: null });
    void deleteProof(path).catch(() => {});
  }

  async function handleProofPick(source: 'camera' | 'gallery') {
    if (!proofHabit) return;

    const habitId = proofHabit.id;
    setProofError(null);
    setProofDenied(false);

    const allowed = await ensureProofPermission(source);
    if (!allowed) {
      setProofDenied(true);
      return;
    }

    try {
      const result = await pickProofImage(source);
      if (result.canceled || !result.assets?.[0]) return;

      const compressed = await compressProof(result.assets[0].uri);
      if (compressed.size > MAX_PROOF_BYTES) {
        setProofError('That photo is too large. Pick a smaller one.');
        return;
      }

      setProofLocalUri(compressed.uri);
      await uploadProofFor(habitId, compressed.uri);
    } catch {
      setProofError('That photo could not be opened. Try another one.');
    }
  }

  function openEditor(task: Task) {
    setEditorTask(task);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditorTask(null);
  }

  const nothingScheduled = progress.total === 0 && !summaryLoading;
  const allDone = progress.total > 0 && progress.remaining === 0 && !summaryLoading;

  return (
    <View style={{ flex: 1 }}>
      <Screen
        refreshControl={
          <RefreshControl
            refreshing={
              habitsQuery.isRefetching || logsQuery.isRefetching || tasksQuery.isRefetching
            }
            onRefresh={refresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }>
        <ScreenHeader
          eyebrow={format(today, 'EEEE d MMMM')}
          title={name ? `Good ${greeting}, ${name}` : `Good ${greeting}`}
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

        <View style={{ marginTop: Space.md, marginBottom: Space.lg }}>
          <ReminderBanner onOpen={() => router.push('/journal/review')} />
        </View>

        {summaryLoading ? (
          <View style={{ gap: Space.md, marginBottom: Space.lg }}>
            <Skeleton height={12} width="40%" />
            <Skeleton height={8} />
          </View>
        ) : progress.total > 0 ? (
          <View style={{ marginBottom: Space.lg, gap: Space.xs + 2 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <AppText variant="smallStrong">
                {progress.done} of {progress.total} done
              </AppText>
              {allDone ? (
                <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(Motion.slow)}>
                  <AppText variant="small" tone="accent">
                    All done for today.
                  </AppText>
                </Animated.View>
              ) : null}
            </View>
            <ProgressBar ratio={progress.ratio} />
          </View>
        ) : null}

        {nothingScheduled && habitRows.length === 0 && taskRows.length === 0 ? (
          <EmptyState
            icon={<HabitsIcon size={20} color={colors.textTertiary} />}
            title="Nothing scheduled today"
            message="Add a habit or a task to get started."
            action={
              <View style={{ flexDirection: 'row', gap: Space.sm }}>
                <Button
                  label="Add a habit"
                  onPress={() => router.navigate('/habits')}
                  fullWidth={false}
                />
                <Button
                  label="Add a task"
                  variant="secondary"
                  onPress={() => setQuickAddOpen(true)}
                  fullWidth={false}
                />
              </View>
            }
          />
        ) : (
          <>
            <View style={{ marginTop: Space.lg }}>
              <SectionHeader
                title="Habits"
                count={habitsLoading ? undefined : habitRows.length}
                action={<TextLink label="Add" onPress={() => router.navigate('/habits')} />}
              />

              {habitsLoading ? (
                <View style={{ gap: Space.sm }}>
                  <Skeleton height={52} />
                  <Skeleton height={52} />
                </View>
              ) : habitsQuery.isError || logsQuery.isError ? (
                <ErrorState
                  message="Your habits could not be loaded."
                  onRetry={() => {
                    void habitsQuery.refetch();
                    void logsQuery.refetch();
                  }}
                />
              ) : habitRows.length === 0 ? (
                <AppText variant="small" tone="tertiary" style={{ paddingVertical: Space.sm }}>
                  No habits due today.
                </AppText>
              ) : (
                <Card padded={false}>
                  {habitRows.map((entry, index) => (
                    <TodayHabitRow
                      key={entry.habit.id}
                      entry={entry}
                      done={doneByHabit.get(entry.habit.id) ?? NO_LOGS}
                      today={today}
                      proofPath={proofByHabit.get(entry.habit.id) ?? null}
                      last={index === habitRows.length - 1}
                      onToggle={() => {
                        tapFeedback();
                        const currentlyDone =
                          doneByHabit.get(entry.habit.id)?.has(todayKey) ?? false;
                        toggleHabitDay.mutate({
                          habitId: entry.habit.id,
                          date: todayKey,
                          done: !currentlyDone,
                        });
                        if (!currentlyDone && entry.habit.ask_for_proof) {
                          setProofHabit({ id: entry.habit.id, name: entry.habit.name });
                        }
                      }}
                      onOpen={() => router.navigate('/habits')}
                      onReplaceProof={() => {
                        setProofPreviousPath(proofByHabit.get(entry.habit.id) ?? null);
                        setProofHabit({ id: entry.habit.id, name: entry.habit.name });
                      }}
                      onRemoveProof={() => {
                        const path = proofByHabit.get(entry.habit.id);
                        if (path) void removeProofFor(entry.habit.id, path);
                      }}
                    />
                  ))}
                </Card>
              )}
            </View>

            <View style={{ marginTop: Space.xl }}>
              <SectionHeader
                title="Tasks"
                count={tasksLoading ? undefined : taskRows.length}
                action={<TextLink label="All" onPress={() => router.navigate('/tasks')} />}
              />

              {tasksLoading ? (
                <View style={{ gap: Space.sm }}>
                  <Skeleton height={44} />
                  <Skeleton height={44} />
                </View>
              ) : tasksQuery.isError ? (
                <ErrorState
                  message="Your tasks could not be loaded."
                  onRetry={() => void tasksQuery.refetch()}
                />
              ) : taskRows.length === 0 ? (
                <AppText variant="small" tone="tertiary" style={{ paddingVertical: Space.sm }}>
                  No tasks due today.
                </AppText>
              ) : (
                <Card padded={false}>
                  {taskRows.map((task, index) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      category={task.category_id ? categoriesById.get(task.category_id) : undefined}
                      onToggle={() => {
                        tapFeedback();
                        setTaskCompleted.mutate({
                          taskId: task.id,
                          completed: !task.completed,
                        });
                      }}
                      onOpen={() => openEditor(task)}
                      last={index === taskRows.length - 1}
                    />
                  ))}
                </Card>
              )}
            </View>
          </>
        )}

        {editorOpen && editorTask ? (
          <TaskEditor
            visible
            task={editorTask}
            defaultDate={editorTask.due_date ?? todayString(today)}
            onClose={closeEditor}
          />
        ) : null}

        {newTaskOpen ? (
          <TaskEditor
            visible
            task={null}
            defaultDate={todayString(today)}
            onClose={() => setNewTaskOpen(false)}
          />
        ) : null}

        <Sheet
          visible={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          title="Add a task"
          subtitle="Quick entry">
          <QuickAdd placeholder="What needs doing?" dueDate={todayString(today)} />
        </Sheet>

        <Sheet
          visible={proofHabit !== null}
          onClose={closeProofSheet}
          title={proofPreviousPath ? 'Replace the photo?' : 'Add a photo?'}
          subtitle={proofHabit?.name ?? ''}
          footer={
            <Button
              label="Skip"
              variant="quiet"
              onPress={closeProofSheet}
              disabled={proofUploading}
            />
          }>
          <View style={{ gap: Space.md, alignItems: 'center' }}>
            <ProofThumbnail uri={proofLocalUri ?? proofUri} size={96} />

            {proofUploading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
                <ActivityIndicator color={colors.accent} />
                <AppText variant="small" tone="secondary">
                  Uploading…
                </AppText>
              </View>
            ) : null}

            {proofError ? (
              <View style={{ gap: Space.sm, alignItems: 'center' }}>
                <AppText variant="small" tone="secondary" style={{ textAlign: 'center' }}>
                  {proofError}
                </AppText>
                {proofLocalUri && proofHabit ? (
                  <Button
                    label="Retry upload"
                    variant="secondary"
                    fullWidth={false}
                    onPress={() => void uploadProofFor(proofHabit.id, proofLocalUri)}
                  />
                ) : null}
              </View>
            ) : null}

            {proofDenied ? (
              <View style={{ gap: Space.sm, alignItems: 'center' }}>
                <AppText variant="small" tone="secondary" style={{ textAlign: 'center' }}>
                  {isWeb
                    ? 'Your browser blocked the file picker. Allow it, then try again.'
                    : 'Pace needs permission to use your photos. You can grant it in Settings.'}
                </AppText>
                {isWeb ? null : (
                  <Button
                    label="Open settings"
                    variant="secondary"
                    fullWidth={false}
                    onPress={() => void Linking.openSettings()}
                  />
                )}
              </View>
            ) : null}

            {!proofUploading && !proofUri && !proofLocalUri ? (
              <View style={{ flexDirection: 'row', gap: Space.sm }}>
                {isWeb ? null : (
                  <Button
                    label="Camera"
                    onPress={() => void handleProofPick('camera')}
                    fullWidth={false}
                  />
                )}
                <Button
                  label="Gallery"
                  variant="secondary"
                  onPress={() => void handleProofPick('gallery')}
                  fullWidth={false}
                />
              </View>
            ) : null}

            <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
              Only you can see this photo.
            </AppText>
          </View>
        </Sheet>

        <View style={{ height: Space.xxl }} />
      </Screen>

      <Pressable
        onPress={() => setQuickAddOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Add a task"
        style={({ pressed }) => ({
          position: 'absolute',
          right: Space.lg,
          bottom: Space.lg,
          width: 56,
          height: 56,
          borderRadius: Radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
          opacity: pressed ? 0.8 : 1,
        })}>
        <PlusIcon size={24} color={colors.accentText} />
      </Pressable>
    </View>
  );
}
