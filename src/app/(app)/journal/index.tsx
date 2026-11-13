import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, View } from 'react-native';

import { Button, ButtonRow, TextLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { JournalIcon, MoonIcon, SearchIcon } from '@/components/ui/icons';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Radius, Space } from '@/constants/theme';
import { todayString } from '@/lib/dates';
import { useTheme } from '@/lib/use-theme';
import type { JournalEntry } from '@/types/database';

import { EntryCard, entryDateLabel } from '@/features/journal/components/entry-card';
import { EntryEditor } from '@/features/journal/components/entry-editor';
import { MoodChart } from '@/features/journal/components/mood-chart';
import {
  averageMood,
  entryPreview,
  groupEntriesByMonth,
  journalingStreak,
  moodEmoji,
  moodTrend,
  searchEntries,
  tagNamesByEntry,
  wordCount,
} from '@/features/journal/journal';
import { useJournalEntries, useJournalEntryTags, useJournalTags } from '@/features/journal/queries';
import { buildDaySummaries, moodHabitInsight } from '@/features/journal/correlation';
import { useHabitLogs, useHabits } from '@/features/habits/queries';

/** How many entries render at once before "Show older entries". */
const PAGE_SIZE = 40;

/**
 * The mood/habit line only appears when the gap is big enough to mean
 * something. A 2-point difference is noise, not an insight.
 */
const MIN_INSIGHT_GAP = 0.08;

/**
 * The journal: today's entry, a month-by-month history, search and a mood
 * chart. The guided evening review lives one tap away in the header.
 */
export default function JournalScreen() {
  const { colors } = useTheme();

  const entriesQuery = useJournalEntries();
  const tagsQuery = useJournalTags();
  const entryTagsQuery = useJournalEntryTags();
  const logsQuery = useHabitLogs();
  const habitsQuery = useHabits();

  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editor, setEditor] = useState<{ date: string; entry: JournalEntry | null } | null>(null);

  const entries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data]);
  const tags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);
  const links = useMemo(() => entryTagsQuery.data ?? [], [entryTagsQuery.data]);

  const today = new Date();
  const todayKey = todayString(today);

  /** Tag names per entry, computed once per fetch instead of per card. */
  const namesByEntry = useMemo(() => tagNamesByEntry(links, tags), [links, tags]);

  /** Proof photo paths grouped by day, for the entry editor. */
  const proofsByDate = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const log of logsQuery.data ?? []) {
      if (!log.proof_path) continue;
      const paths = map.get(log.log_date) ?? [];
      paths.push(log.proof_path);
      map.set(log.log_date, paths);
    }

    return map;
  }, [logsQuery.data]);

  const filtered = useMemo(
    () => searchEntries(entries, links, tags, query),
    [entries, links, tags, query],
  );
  // Long journals render in pages so opening the tab stays quick on a phone.
  const shown = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const groups = groupEntriesByMonth(shown);

  const todayEntry = entries.find((entry) => entry.entry_date === todayKey) ?? null;
  const streak = journalingStreak(entries, today);
  const trend = moodTrend(entries, 30, today);
  const average = averageMood(entries, 30, today);

  const insight = habitsQuery.data
    ? moodHabitInsight(
        buildDaySummaries(entries, habitsQuery.data, logsQuery.data ?? [], 30, today),
      )
    : null;

  const loading = entriesQuery.isPending || tagsQuery.isPending || entryTagsQuery.isPending;
  const loadFailed = entriesQuery.isError || tagsQuery.isError || entryTagsQuery.isError;

  function refresh() {
    void entriesQuery.refetch();
    void tagsQuery.refetch();
    void entryTagsQuery.refetch();
  }

  function openEditor(date: string, entry: JournalEntry | null) {
    setEditor({ date, entry });
  }

  /** Tags to preselect when the editor opens for a day. */
  function tagIdsFor(entry: JournalEntry | null): string[] {
    if (!entry) return [];
    return links.filter((link) => link.entry_id === entry.id).map((link) => link.tag_id);
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={
            entriesQuery.isRefetching || tagsQuery.isRefetching || entryTagsQuery.isRefetching
          }
          onRefresh={refresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }>
      <ScreenHeader
        eyebrow="Reflection"
        title="Journal"
        subtitle="A few honest lines at the end of the day."
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

      {loading ? (
        <View style={{ paddingVertical: Space.huge, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : loadFailed ? (
        <ErrorState
          message="Your journal could not be loaded. This is usually a connection problem."
          onRetry={refresh}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<JournalIcon size={20} color={colors.textTertiary} />}
          title="No entries yet"
          message="The evening review walks through your day, asks how it felt, and saves your words here. Two minutes, once a day."
          action={
            <ButtonRow>
              <Button
                label="Evening review"
                onPress={() => router.push('/journal/review')}
                fullWidth={false}
              />
              <Button
                label="Write freely"
                variant="secondary"
                onPress={() => openEditor(todayKey, null)}
                fullWidth={false}
              />
            </ButtonRow>
          }
        />
      ) : (
        <>
          <Card>
            <View style={{ gap: Space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
                <AppText variant="overline" tone="tertiary" style={{ flex: 1 }}>
                  Today
                </AppText>
                {todayEntry?.mood ? (
                  <AppText style={{ fontSize: 20 }} accessibilityLabel="Today's mood">
                    {moodEmoji(todayEntry.mood)}
                  </AppText>
                ) : null}
              </View>

              {todayEntry ? (
                <>
                  <AppText variant="bodyStrong" numberOfLines={2}>
                    {todayEntry.title ||
                      entryPreview(todayEntry.body, 90) ||
                      'A mood, no words yet.'}
                  </AppText>
                  <AppText variant="caption" tone="tertiary">
                    {entryDateLabel(todayEntry.entry_date)} ·{' '}
                    {wordCount(todayEntry.body) === 1
                      ? '1 word'
                      : `${wordCount(todayEntry.body)} words`}
                  </AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.lg }}>
                    <Button
                      label="Open today's entry"
                      variant="secondary"
                      onPress={() => openEditor(todayKey, todayEntry)}
                      fullWidth={false}
                    />
                    <TextLink
                      label="Add to it"
                      onPress={() => router.push('/journal/review')}
                      align="right"
                    />
                  </View>
                </>
              ) : (
                <>
                  <AppText variant="bodyStrong">Today is still open</AppText>
                  <AppText variant="small" tone="secondary">
                    A couple of minutes now keeps the day from blurring into tomorrow.
                  </AppText>
                  <ButtonRow>
                    <Button
                      label="Evening review"
                      onPress={() => router.push('/journal/review')}
                      fullWidth={false}
                    />
                    <Button
                      label="Write freely"
                      variant="secondary"
                      onPress={() => openEditor(todayKey, null)}
                      fullWidth={false}
                    />
                  </ButtonRow>
                </>
              )}
            </View>
          </Card>

          <View style={{ marginTop: Space.xxl }}>
            <SectionHeader title="Mood" />

            <Card>
              <View style={{ gap: Space.md }}>
                <View style={{ flexDirection: 'row', gap: Space.xl }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="heading">{streak === 1 ? '1 day' : `${streak} days`}</AppText>
                    <AppText variant="caption" tone="tertiary">
                      writing streak
                    </AppText>
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="heading">
                      {average === null ? '—' : `${average.toFixed(1)} / 5`}
                    </AppText>
                    <AppText variant="caption" tone="tertiary">
                      mood, last 30 days
                    </AppText>
                  </View>
                </View>

                <MoodChart points={trend} average={average} />
              </View>
            </Card>
          </View>

          {insight && Math.abs(insight.delta) >= MIN_INSIGHT_GAP ? (
            <View style={{ marginTop: Space.xxl }}>
              <Card>
                <View style={{ gap: Space.sm }}>
                  <AppText variant="overline" tone="tertiary">
                    Mood and habits
                  </AppText>
                  <AppText variant="bodyStrong">
                    On days you felt good, you completed {Math.round(insight.positiveRate * 100)}%
                    of your habits, versus {Math.round(insight.negativeRate * 100)}% on rough days.
                  </AppText>
                  <AppText variant="caption" tone="tertiary">
                    Based on {insight.positiveDays} good and {insight.negativeDays} rough days in
                    the last 30.
                  </AppText>
                </View>
              </Card>
            </View>
          ) : null}

          <View style={{ marginTop: Space.xxl }}>
            <TextField
              label="Search entries"
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Words or a tag"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>

          {filtered.length === 0 ? (
            <View style={{ marginTop: Space.lg }}>
              <EmptyState
                icon={<SearchIcon size={20} color={colors.textTertiary} />}
                title="No entries match"
                message={`Nothing in your journal mentions “${query.trim()}”. Try a shorter word or a tag.`}
              />
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.key} style={{ marginTop: Space.xxl }}>
                <SectionHeader title={group.title} count={group.entries.length} />

                <View style={{ gap: Space.md }}>
                  {group.entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      tagNames={namesByEntry.get(entry.id) ?? []}
                      onOpen={() => openEditor(entry.entry_date, entry)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}

          {filtered.length > visibleCount ? (
            <View style={{ marginTop: Space.xl, alignItems: 'center', gap: Space.xs }}>
              <Button
                label="Show older entries"
                variant="secondary"
                fullWidth={false}
                onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
              />
              <AppText variant="caption" tone="tertiary">
                Showing {visibleCount} of {filtered.length}
              </AppText>
            </View>
          ) : null}
        </>
      )}

      {editor ? (
        <EntryEditor
          visible
          date={editor.date}
          entry={editor.entry}
          initialTagIds={tagIdsFor(editor.entry)}
          allTags={tags}
          proofPaths={proofsByDate.get(editor.date) ?? []}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </Screen>
  );
}
