import { addDays } from 'date-fns';

import { habitsForToday } from '@/features/today/summary';
import { toDateString } from '@/lib/dates';
import type { Habit, HabitLog, JournalEntry } from '@/types/database';
import type { TodayHabit } from '@/features/today/summary';

/** One day's inputs to the correlation. */
export type DaySummary = {
  date: string;
  mood: number | null;
  done: number;
  total: number;
};

export type MoodHabitInsight = {
  positiveDays: number;
  negativeDays: number;
  positiveRate: number;
  negativeRate: number;
  /** positiveRate - negativeRate, in percentage points. */
  delta: number;
};

/**
 * Compares habit completion on good-mood days (mood >= 4) with bad-mood days
 * (mood <= 2). Returns null until there are at least `minDays` days in each
 * bucket, so the first number shown is never a fluke.
 */
export function moodHabitInsight(days: DaySummary[], minDays = 4): MoodHabitInsight | null {
  const positive = days.filter((day) => day.mood !== null && day.mood >= 4 && day.total > 0);
  const negative = days.filter((day) => day.mood !== null && day.mood <= 2 && day.total > 0);

  if (positive.length < minDays || negative.length < minDays) return null;

  const rate = (bucket: DaySummary[]) =>
    bucket.reduce((sum, day) => sum + day.done / day.total, 0) / bucket.length;

  const positiveRate = rate(positive);
  const negativeRate = rate(negative);

  return {
    positiveDays: positive.length,
    negativeDays: negative.length,
    positiveRate,
    negativeRate,
    delta: positiveRate - negativeRate,
  };
}

/**
 * Builds the per-day summaries the insight needs, over the last `days` days.
 * Habits are evaluated against their own schedule, so a habit that is not due
 * on a given day does not count against that day.
 */
export function buildDaySummaries(
  entries: JournalEntry[],
  habits: Habit[],
  logs: HabitLog[],
  days: number,
  today: Date,
): DaySummary[] {
  const doneByHabit = new Map<string, Set<string>>();

  for (const log of logs) {
    const existing = doneByHabit.get(log.habit_id);
    if (existing) {
      existing.add(log.log_date);
    } else {
      doneByHabit.set(log.habit_id, new Set([log.log_date]));
    }
  }

  const moodByDate = new Map(entries.map((entry) => [entry.entry_date, entry.mood]));

  const result: DaySummary[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = addDays(today, -offset);
    const key = toDateString(date);
    const todays: TodayHabit[] = habitsForToday(habits, doneByHabit, date);

    result.push({
      date: key,
      mood: moodByDate.get(key) ?? null,
      done: todays.filter((entry) => entry.done).length,
      total: todays.length,
    });
  }

  return result;
}
