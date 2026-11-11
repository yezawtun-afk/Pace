import { addDays } from 'date-fns';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Button, ButtonRow, TextLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dot } from '@/components/ui/chip';
import { ErrorState } from '@/components/ui/error-state';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Space } from '@/constants/theme';
import { friendlyDataError } from '@/features/auth/errors';
import { useHabitLogs, useHabits } from '@/features/habits/queries';
import { habitsForToday } from '@/features/today/summary';
import { MoodPicker } from '@/features/journal/components/mood-picker';
import { TagPicker } from '@/features/journal/components/tag-picker';
import { promptForDate } from '@/features/journal/journal';
import {
  useCreateTag,
  useJournalEntries,
  useJournalEntryTags,
  useJournalTags,
  useSaveEntry,
  useSetEntryTags,
} from '@/features/journal/queries';
import { useRescheduleTasks, useTasks } from '@/features/tasks/queries';
import { toDateString, todayString } from '@/lib/dates';
import { useTheme } from '@/lib/use-theme';
import type { TodayHabit } from '@/features/today/summary';
import type { JournalEntry, Tag, Task } from '@/types/database';

import { JOURNAL_PROMPTS } from '@/constants/prompts';

const STEP_TITLES = [
  'What happened today',
  'Anything left over?',
  'How did it feel?',
  'Anything worth keeping?',
];

const STEP_SUBTITLES = [
  'No judgement — just the shape of the day.',
  'You can move what is unfinished to tomorrow, or leave it where it is.',
  'One tap, no wrong answer.',
  'A few lines is plenty. This becomes today’s journal entry.',
];

/**
 * The evening review: four short steps that end as today's journal entry.
 *
 * Step 2 offers to push unfinished tasks to tomorrow so the next day starts
 * clean. Everything else is optional — the mood, the words and the tags are
 * yours to skip.
 */
export default function ReviewScreen() {
  const { colors } = useTheme();

  const habitsQuery = useHabits();
  const logsQuery = useHabitLogs();
  const tasksQuery = useTasks('today');
  const entriesQuery = useJournalEntries();
  const tagsQuery = useJournalTags();
  const entryTagsQuery = useJournalEntryTags();

  const today = new Date();
  const todayKey = todayString(today);

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

  const loading =
    habitsQuery.isPending ||
    logsQuery.isPending ||
    tasksQuery.isPending ||
    entriesQuery.isPending ||
    tagsQuery.isPending ||
    entryTagsQuery.isPending;

  const failed =
    habitsQuery.isError ||
    logsQuery.isError ||
    tasksQuery.isError ||
    entriesQuery.isError ||
    tagsQuery.isError ||
    entryTagsQuery.isError;

  function retry() {
    void habitsQuery.refetch();
    void logsQuery.refetch();
    void tasksQuery.refetch();
    void entriesQuery.refetch();
    void tagsQuery.refetch();
    void entryTagsQuery.refetch();
  }

  if (loading) {
    return (
      <Screen>
        <ScreenHeader
          eyebrow="Evening review"
          title="One last look"
          subtitle="Gathering the day…"
        />
        <View style={{ paddingVertical: Space.huge, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (failed) {
    return (
      <Screen>
        <ScreenHeader eyebrow="Evening review" title="One last look" />
        <ErrorState
          message="Today could not be gathered. This is usually a connection problem."
          onRetry={retry}
        />
      </Screen>
    );
  }

  const entries = entriesQuery.data ?? [];
  const existing = entries.find((entry) => entry.entry_date === todayKey) ?? null;
  const existingTagIds = existing
    ? (entryTagsQuery.data ?? [])
        .filter((link) => link.entry_id === existing.id)
        .map((link) => link.tag_id)
    : [];

  return (
    <ReviewFlow
      today={today}
      todayKey={todayKey}
      existing={existing}
      existingTagIds={existingTagIds}
      habits={habitsForToday(habitsQuery.data ?? [], doneByHabit, today)}
      tasks={tasksQuery.data ?? []}
      tags={tagsQuery.data ?? []}
    />
  );
}

type ReviewFlowProps = {
  today: Date;
  todayKey: string;
  existing: JournalEntry | null;
  existingTagIds: string[];
  habits: TodayHabit[];
  tasks: Task[];
  tags: Tag[];
};

function ReviewFlow({
  today,
  todayKey,
  existing,
  existingTagIds,
  habits,
  tasks,
  tags,
}: ReviewFlowProps) {
  const { colors } = useTheme();

  const saveEntry = useSaveEntry();
  const saveTags = useSetEntryTags();
  const createTag = useCreateTag();
  const reschedule = useRescheduleTasks();

  const [step, setStep] = useState(0);
  const [body, setBody] = useState(existing?.body ?? '');
  const [mood, setMood] = useState<number | null>(existing?.mood ?? null);
  const [promptText, setPromptText] = useState(existing?.prompt_text ?? promptForDate(today));
  const [tagIds, setTagIds] = useState<string[]>(existingTagIds);

  const openTasks = tasks.filter((task) => !task.completed);
  const doneTasks = tasks.filter((task) => task.completed);

  const [taskIds, setTaskIds] = useState<string[]>(openTasks.map((task) => task.id));
  const [moved, setMoved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  const tomorrow = toDateString(addDays(today, 1));

  const habitsDone = habits.filter((entry) => entry.done).length;
  const missedHabits = habits.filter((entry) => !entry.done).map((entry) => entry.habit.name);

  function toggleTask(id: string) {
    setTaskIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function moveToTomorrow() {
    if (taskIds.length === 0 || moved) return;

    setError(null);
    reschedule.mutate(
      { ids: taskIds, dueDate: tomorrow },
      {
        onSuccess: () => {
          setMoved(true);
          setTaskIds([]);
        },
        onError: () => setError('Those tasks could not be moved. Try again.'),
      },
    );
  }

  function toggleTag(tagId: string) {
    setTagError(null);
    setTagIds((current) =>
      current.includes(tagId) ? current.filter((value) => value !== tagId) : [...current, tagId],
    );
  }

  async function addTag(name: string) {
    setTagError(null);

    try {
      const tag = await createTag.mutateAsync(name);
      setTagIds((current) => (current.includes(tag.id) ? current : [...current, tag.id]));
    } catch {
      setTagError('That tag could not be created. Try again.');
    }
  }

  function anotherPrompt() {
    const index = JOURNAL_PROMPTS.indexOf(promptText);
    setPromptText(JOURNAL_PROMPTS[(index + 1) % JOURNAL_PROMPTS.length]);
  }

  async function finish() {
    if (saving) return;

    const hasWords = body.trim().length > 0;

    // Nothing to record and nothing existed before: just close the flow.
    if (!hasWords && mood === null && tagIds.length === 0 && !existing) {
      router.replace('/journal');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const row = await saveEntry.mutateAsync({
        entryDate: todayKey,
        title: existing?.title ?? null,
        body,
        mood,
        promptText,
      });

      await saveTags.mutateAsync({ entryId: row.id, tagIds });

      router.replace('/journal');
    } catch (cause) {
      setSaving(false);
      setError(friendlyDataError(cause));
    }
  }

  function next() {
    if (step < STEP_TITLES.length - 1) {
      setStep(step + 1);
      return;
    }
    void finish();
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow={`Evening review · ${step + 1} of ${STEP_TITLES.length}`}
        title={STEP_TITLES[step]}
        subtitle={STEP_SUBTITLES[step]}
      />

      <View style={{ flexDirection: 'row', gap: Space.xs + 1, marginBottom: Space.xl }}>
        {STEP_TITLES.map((title, index) => (
          <View
            key={title}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: index <= step ? colors.accent : colors.surfaceMuted,
            }}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={{ gap: Space.lg }}>
          <Card>
            <View style={{ gap: Space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Space.sm }}>
                <AppText variant="bodyStrong" style={{ flex: 1 }}>
                  Habits
                </AppText>
                <AppText variant="small" tone="secondary">
                  {habitsDone} of {habits.length} done
                </AppText>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Space.sm }}>
                <AppText variant="bodyStrong" style={{ flex: 1 }}>
                  Tasks
                </AppText>
                <AppText variant="small" tone="secondary">
                  {doneTasks.length} of {tasks.length} done
                </AppText>
              </View>
            </View>
          </Card>

          {missedHabits.length > 0 || openTasks.length > 0 ? (
            <View style={{ gap: Space.sm }}>
              <AppText variant="smallStrong" tone="secondary">
                Not done today
              </AppText>

              <Card>
                <View style={{ gap: Space.sm + 2 }}>
                  {missedHabits.map((name) => (
                    <View
                      key={name}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
                      <Dot color={colors.textTertiary} />
                      <AppText variant="small" tone="secondary" style={{ flex: 1 }}>
                        {name}
                      </AppText>
                    </View>
                  ))}

                  {openTasks.map((task) => (
                    <View
                      key={task.id}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
                      <Dot color={colors.textTertiary} />
                      <AppText variant="small" tone="secondary" style={{ flex: 1 }}>
                        {task.title}
                      </AppText>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          ) : (
            <AppText variant="small" tone="secondary">
              Everything planned got done. Nothing to carry into tomorrow.
            </AppText>
          )}
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: Space.lg }}>
          {moved ? (
            <AppText variant="small" tone="secondary">
              Moved to tomorrow. The rest of the evening is yours.
            </AppText>
          ) : openTasks.length === 0 ? (
            <AppText variant="small" tone="secondary">
              Nothing left open — the day is tidy.
            </AppText>
          ) : (
            <>
              <Card padded={false}>
                {openTasks.map((task, index) => {
                  const selected = taskIds.includes(task.id);

                  return (
                    <Pressable
                      key={task.id}
                      onPress={() => toggleTask(task.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${task.title}, ${
                        selected ? 'selected to move' : 'staying put'
                      }`}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Space.md,
                        minHeight: 52,
                        paddingLeft: Space.md,
                        paddingRight: Space.xs,
                        borderBottomWidth: index === openTasks.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}>
                      <AppText variant="body" style={{ flex: 1 }}>
                        {task.title}
                      </AppText>
                      <Checkbox
                        checked={selected}
                        onPress={() => toggleTask(task.id)}
                        label={`Move ${task.title} to tomorrow`}
                      />
                    </Pressable>
                  );
                })}
              </Card>

              <View style={{ gap: Space.xs }}>
                <Button
                  label={
                    taskIds.length === 0
                      ? 'Nothing selected'
                      : taskIds.length === 1
                        ? 'Move 1 task to tomorrow'
                        : `Move ${taskIds.length} tasks to tomorrow`
                  }
                  variant="secondary"
                  onPress={moveToTomorrow}
                  disabled={taskIds.length === 0}
                  loading={reschedule.isPending}
                />
                <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
                  Anything you leave stays on its original date.
                </AppText>
              </View>
            </>
          )}
        </View>
      ) : null}

      {step === 2 ? <MoodPicker value={mood} onChange={setMood} /> : null}

      {step === 3 ? (
        <View style={{ gap: Space.xl }}>
          <View
            style={{
              gap: Space.sm,
              padding: Space.md + 2,
              borderRadius: 12,
              backgroundColor: colors.surfaceMuted,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText variant="overline" tone="tertiary" style={{ flex: 1 }}>
                Prompt
              </AppText>
              <TextLink label="Another" onPress={anotherPrompt} align="right" />
            </View>
            <AppText variant="body">{promptText}</AppText>
          </View>

          <TextField
            label="Your words"
            value={body}
            onChangeText={setBody}
            placeholder="A few honest lines are enough."
            multiline
            minHeight={150}
            maxLength={8000}
          />

          <View style={{ gap: Space.sm }}>
            <AppText variant="smallStrong">Tags</AppText>
            <TagPicker
              tags={tags}
              selectedIds={tagIds}
              onToggle={toggleTag}
              onCreate={(name) => void addTag(name)}
              creating={createTag.isPending}
              error={tagError}
            />
          </View>
        </View>
      ) : null}

      {error ? (
        <AppText variant="small" tone="danger" style={{ marginTop: Space.lg }}>
          {error}
        </AppText>
      ) : null}

      <View style={{ marginTop: Space.xxl }}>
        <ButtonRow>
          {step > 0 ? (
            <Button
              label="Back"
              variant="secondary"
              onPress={() => setStep(step - 1)}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          ) : null}

          <Button
            label={step === STEP_TITLES.length - 1 ? 'Save and finish' : 'Continue'}
            onPress={next}
            loading={saving}
            fullWidth={false}
            style={{ flex: 1 }}
          />
        </ButtonRow>

        <TextLink
          label="Leave without saving"
          onPress={() => router.replace('/journal')}
          align="center"
          tone="accent"
        />
      </View>
    </Screen>
  );
}
