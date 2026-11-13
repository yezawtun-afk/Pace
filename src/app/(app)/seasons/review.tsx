import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckIcon } from '@/components/ui/icons';
import { ErrorState } from '@/components/ui/error-state';
import { AppText } from '@/components/ui/text';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';
import { useProfile, useUpdateProfile } from '@/features/auth/use-profile';
import { useHabitLogs, useHabits, useUpdateHabit } from '@/features/habits/queries';
import { currentStreak } from '@/features/habits/stats';
import { seasonQuote, formatSeasonRange } from '@/features/habits/seasons';
import { useJournalEntries } from '@/features/journal/queries';
import { averageMood } from '@/features/journal/journal';
import { todayString, toDateString } from '@/lib/dates';

export default function SeasonReviewScreen() {
  const { colors } = useTheme();
  const profileQuery = useProfile();
  const habitsQuery = useHabits();
  const logsQuery = useHabitLogs();
  const entriesQuery = useJournalEntries();
  const updateProfile = useUpdateProfile();
  const updateHabit = useUpdateHabit();

  const [retire, setRetire] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const todayKey = todayString(today);
  const seasonStart = profileQuery.data?.current_season_start ?? null;

  const loading =
    profileQuery.isPending ||
    habitsQuery.isPending ||
    logsQuery.isPending ||
    entriesQuery.isPending;
  const failed =
    profileQuery.isError || habitsQuery.isError || logsQuery.isError || entriesQuery.isError;

  function retry() {
    void profileQuery.refetch();
    void habitsQuery.refetch();
    void logsQuery.refetch();
    void entriesQuery.refetch();
  }

  const habits = habitsQuery.data ?? [];
  const logs = logsQuery.data ?? [];
  const entries = entriesQuery.data ?? [];

  const doneByHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    const existing = doneByHabit.get(log.habit_id);
    if (existing) existing.add(log.log_date);
    else doneByHabit.set(log.habit_id, new Set([log.log_date]));
  }

  const seasonStartKey = seasonStart ?? toDateString(today);
  const inSeasonLogs = logs.filter((log) => log.log_date >= seasonStartKey);
  const inSeasonEntries = entries.filter((entry) => entry.entry_date >= seasonStartKey);

  const totalCompletions = inSeasonLogs.length;
  const bestStreak = habits.reduce((best, habit) => {
    const done = doneByHabit.get(habit.id) ?? new Set();
    return Math.max(best, currentStreak(habit, done, today));
  }, 0);
  const moodAvg = averageMood(inSeasonEntries, 30, today);
  const quote = seasonQuote(inSeasonEntries, seasonStart, today);

  async function startNext() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      // Retire the chosen habits.
      for (const habit of habits) {
        if (retire.has(habit.id) && !habit.archived) {
          await updateHabit.mutateAsync({
            id: habit.id,
            draft: {
              name: habit.name,
              icon: habit.icon,
              color: habit.color,
              frequency_type: habit.frequency_type,
              frequency_days: habit.frequency_days,
              target_per_week: habit.target_per_week,
              ask_for_proof: habit.ask_for_proof,
              identity: habit.identity,
              archived: true,
            },
          });
        }
      }

      await updateProfile.mutateAsync({ current_season_start: todayKey });

      router.replace('/today');
    } catch (cause) {
      setSaving(false);
      setError(cause instanceof Error ? cause.message : 'Could not start the new season.');
    }
  }

  if (loading) {
    return (
      <Screen>
        <ScreenHeader eyebrow="Season" title="Closing the chapter" />
        <View style={{ paddingVertical: Space.huge, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (failed) {
    return (
      <Screen>
        <ScreenHeader eyebrow="Season" title="Closing the chapter" />
        <ErrorState message="Could not load the season." onRetry={retry} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Season review"
        title="Thirty days, closed"
        subtitle={formatSeasonRange(seasonStart, today)}
      />

      <Card>
        <View style={{ gap: Space.md }}>
          <View style={{ flexDirection: 'row', gap: Space.xl }}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{totalCompletions}</AppText>
              <AppText variant="caption" tone="tertiary">
                check-offs
              </AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{bestStreak}</AppText>
              <AppText variant="caption" tone="tertiary">
                best streak
              </AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{moodAvg === null ? '—' : moodAvg.toFixed(1)}</AppText>
              <AppText variant="caption" tone="tertiary">
                avg mood
              </AppText>
            </View>
          </View>

          <AppText variant="caption" tone="tertiary">
            {inSeasonEntries.length} journal {inSeasonEntries.length === 1 ? 'entry' : 'entries'} ·{' '}
            {habits.length} habits tracked
          </AppText>
        </View>
      </Card>

      {quote ? (
        <View style={{ marginTop: Space.xxl }}>
          <Card>
            <AppText variant="body" style={{ fontStyle: 'italic' }}>
              “{quote}”
            </AppText>
          </Card>
        </View>
      ) : null}

      <View style={{ marginTop: Space.xxl }}>
        <AppText variant="overline" tone="tertiary" style={{ marginBottom: Space.sm }}>
          Habits for the next season
        </AppText>
        <Card padded={false}>
          {habits.map((habit, index) => {
            const keep = !retire.has(habit.id);
            return (
              <Pressable
                key={habit.id}
                onPress={() => {
                  setRetire((current) => {
                    const next = new Set(current);
                    if (next.has(habit.id)) next.delete(habit.id);
                    else next.add(habit.id);
                    return next;
                  });
                }}
                accessibilityRole="checkbox"
                accessibilityLabel={keep ? `Keep ${habit.name}` : `Retire ${habit.name}`}
                accessibilityState={{ checked: keep }}
                aria-checked={keep}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Space.md,
                  padding: Space.md + 2,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}>
                {/* Drawn inline: a nested Pressable would swallow or double
                    the row's tap on the web. */}
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: Radius.sm - 2,
                    borderWidth: keep ? 0 : 1.5,
                    borderColor: colors.borderStrong,
                    backgroundColor: keep ? colors.accent : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {keep ? (
                    <CheckIcon size={13} color={colors.accentText} strokeWidth={2.4} />
                  ) : null}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong">{habit.name}</AppText>
                  <AppText variant="caption" tone="tertiary">
                    {keep ? 'Continues into the next season' : 'Retired — history kept'}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </Card>
      </View>

      {error ? (
        <AppText variant="small" tone="danger" style={{ marginTop: Space.lg }}>
          {error}
        </AppText>
      ) : null}

      <View style={{ marginTop: Space.xxl }}>
        <Button label="Start the next season" onPress={() => void startNext()} loading={saving} />
        <View style={{ marginTop: Space.sm }}>
          <Button
            label="Not yet"
            variant="quiet"
            onPress={() => router.replace('/today')}
            fullWidth
          />
        </View>
      </View>
    </Screen>
  );
}
