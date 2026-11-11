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

/**
 * The journal: today's entry, a month-by-month history, search and a mood
 * chart. The guided evening review lives one tap away in the header.
 */
export default function JournalScreen() {
  const { colors } = useTheme();

  const entriesQuery = useJournalEntries();
  const tagsQuery = useJournalTags();
  const entryTagsQuery = useJournalEntryTags();

  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{ date: string; entry: JournalEntry | null } | null>(null);

  const entries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data]);
  const tags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);
  const links = useMemo(() => entryTagsQuery.data ?? [], [entryTagsQuery.data]);

  const today = new Date();
  const todayKey = todayString(today);

  /** Tag names per entry, computed once per fetch instead of per card. */
  const namesByEntry = useMemo(() => tagNamesByEntry(links, tags), [links, tags]);

  const filtered = useMemo(
    () => searchEntries(entries, links, tags, query),
    [entries, links, tags, query],
  );
  const groups = groupEntriesByMonth(filtered);

  const todayEntry = entries.find((entry) => entry.entry_date === todayKey) ?? null;
  const streak = journalingStreak(entries, today);
  const trend = moodTrend(entries, 30, today);
  const average = averageMood(entries, 30, today);

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

          <View style={{ marginTop: Space.xxl }}>
            <TextField
              label="Search entries"
              value={query}
              onChangeText={setQuery}
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
        </>
      )}

      {editor ? (
        <EntryEditor
          visible
          date={editor.date}
          entry={editor.entry}
          initialTagIds={tagIdsFor(editor.entry)}
          allTags={tags}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </Screen>
  );
}
