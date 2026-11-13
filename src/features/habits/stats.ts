/**
 * Pure statistics for habits: streaks, completion rates and weekly progress.
 *
 * The rules below are the ones the tests pin down, so they are written to be
 * read as plain sentences.
 */

import { addDays, eachDayOfInterval, startOfDay } from 'date-fns';

import { toDateString } from '@/lib/dates';

import { isScheduledOn, weekDays, weekStart, type HabitSchedule } from './schedule';

type LogLike = { log_date: string };

/** A set of "yyyy-MM-dd" strings, which is how logs are matched. */
export function doneKeys(logs: LogLike[]): Set<string> {
  return new Set(logs.map((log) => log.log_date));
}

export function isDone(logs: Set<string>, date: Date): boolean {
  return logs.has(toDateString(date));
}

/** The last `count` days, oldest first, ending today. */
export function lastDays(count: number, today: Date): Date[] {
  const end = startOfDay(today);
  return eachDayOfInterval({ start: addDays(end, -(count - 1)), end });
}

/**
 * How many completions a window should hold.
 *
 * daily         one per day
 * weekdays      one per scheduled day
 * weekly_target the weekly target, scaled to the length of the window
 */
export function expectedCount(habit: HabitSchedule, days: Date[]): number {
  if (habit.frequency_type === 'weekly_target') {
    const target = habit.target_per_week ?? 1;
    return Math.max(1, Math.round((target * days.length) / 7));
  }

  return days.filter((day) => isScheduledOn(habit, day)).length;
}

/**
 * Completed / expected over a window, from 0 to 1. Returns 1 for an empty
 * window (nothing was missed).
 */
export function completionRate(habit: HabitSchedule, logs: Set<string>, days: Date[]): number {
  const expected = expectedCount(habit, days);
  if (expected === 0) return 1;

  const done = days.filter((day) => logs.has(toDateString(day))).length;
  return Math.min(1, done / expected);
}

/** Rate over the last N days, as a whole percentage. */
export function ratePercent(
  habit: HabitSchedule,
  logs: Set<string>,
  days: number,
  today: Date,
): number {
  return Math.round(completionRate(habit, logs, lastDays(days, today)) * 100);
}

/** Weekly habit: consecutive weeks (Monday→Sunday) that reached the target. */
function weeklyStreak(habit: HabitSchedule, logs: Set<string>, today: Date): number {
  const target = habit.target_per_week ?? 1;
  let streak = 0;
  let start = weekStart(startOfDay(today));

  for (let index = 0; index < 60; index += 1) {
    const days = weekDays(start);
    const done = days.filter((day) => logs.has(toDateString(day))).length;

    if (done >= target) {
      streak += 1;
    } else if (index > 0) {
      // The current week is still open, so an unfinished one never breaks it.
      break;
    }

    start = addDays(start, -7);
  }

  return streak;
}

/**
 * Current streak, in the habit's own rhythm:
 *
 * - rest days are skipped, not counted and not broken;
 * - today can still be unfinished without breaking the streak, because the day
 *   is not over yet;
 * - the moment a scheduled day ends unfinished, the streak resets.
 */
export function currentStreak(habit: HabitSchedule, logs: Set<string>, today: Date): number {
  if (habit.frequency_type === 'weekly_target') {
    return weeklyStreak(habit, logs, today);
  }

  let streak = 0;
  const end = startOfDay(today);

  for (let index = 0; index < 400; index += 1) {
    const day = addDays(end, -index);
    const dayDone = logs.has(toDateString(day));

    // A rest day that was left alone is skipped. One that was checked in
    // anyway counts — a real completion should never look like nothing.
    if (!isScheduledOn(habit, day) && !dayDone) continue;

    if (dayDone) {
      streak += 1;
      continue;
    }

    if (index === 0) continue; // today is still in progress
    break;
  }

  return streak;
}

/**
 * What today looks like for this habit:
 *
 *   done  already checked off
 *   todo  scheduled and still open
 *   rest  not scheduled today (weekday habits only)
 */
export function todayState(
  habit: HabitSchedule,
  logs: Set<string>,
  today: Date,
): 'done' | 'todo' | 'rest' {
  const day = startOfDay(today);
  if (logs.has(toDateString(day))) return 'done';
  return isScheduledOn(habit, day) ? 'todo' : 'rest';
}

export type WeekBucket = {
  /** "yyyy-MM-dd" of that week's Monday — a stable key. */
  start: string;
  done: number;
  /** Completions needed that week; never more than the days elapsed so far. */
  expected: number;
  /** True for the week we are in now. */
  current: boolean;
};

/**
 * The last `count` weeks (oldest first) with their completion counts. The
 * current week only counts the days that have already happened, so a Monday
 * morning never looks like a failed week.
 */
export function weekBuckets(
  habit: HabitSchedule,
  logs: Set<string>,
  today: Date,
  count = 8,
): WeekBucket[] {
  const end = startOfDay(today);
  const thisWeek = weekStart(end);
  const buckets: WeekBucket[] = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const start = addDays(thisWeek, -7 * index);
    const allDays = weekDays(start);
    const elapsed = allDays.filter((day) => day <= end);
    const done = elapsed.filter((day) => logs.has(toDateString(day))).length;

    buckets.push({
      start: toDateString(start),
      done,
      expected: Math.max(expectedCount(habit, elapsed), done > 0 ? done : 0),
      current: index === 0,
    });
  }

  return buckets;
}

/** Days since the most recent completion, or Infinity when it has never been done. */
export function daysSinceLastCompletion(logs: Set<string>, today: Date): number {
  if (logs.size === 0) return Infinity;

  const end = startOfDay(today);
  for (let index = 0; index <= 365; index += 1) {
    const day = addDays(end, -index);
    if (logs.has(toDateString(day))) return index;
  }
  return Infinity;
}

/** Opacity for a habit that has gone quiet: full for three days, then easing to 0.4 by day 14. */
export function rustOpacity(daysSince: number): number {
  if (daysSince === Infinity) return 0.4;
  if (daysSince <= 3) return 1;
  const fade = Math.min(1, (daysSince - 3) / 11);
  return 1 - fade * 0.6;
}

export type RestDayBank = {
  /** Weeks in the last four that earned a rest day. */
  banked: number;
  /** Missed scheduled days in the last week, covered by the bank. */
  spent: number;
  /** What is left to spend. */
  balance: number;
};

function weekReachedTarget(habit: HabitSchedule, logs: Set<string>, start: Date): boolean {
  const days = weekDays(start);
  const done = days.filter((day) => logs.has(toDateString(day))).length;

  if (habit.frequency_type === 'weekly_target') {
    return done >= (habit.target_per_week ?? 1);
  }

  const scheduled = days.filter((day) => isScheduledOn(habit, day)).length;
  if (scheduled === 0) return false;
  return done >= Math.ceil(scheduled * 0.7);
}

/** A rest day is banked for every good week, and spent to cover a recent miss. */
export function restDayBank(
  habit: HabitSchedule,
  logs: Set<string>,
  today: Date,
  weeks = 4,
): RestDayBank {
  const end = startOfDay(today);
  const thisWeek = weekStart(end);

  let banked = 0;
  for (let index = 1; index <= weeks; index += 1) {
    const start = addDays(thisWeek, -7 * index);
    if (weekReachedTarget(habit, logs, start)) banked += 1;
  }

  const missed = lastDays(7, today).filter(
    (day) => isScheduledOn(habit, day) && !logs.has(toDateString(day)),
  ).length;

  const spent = Math.min(banked, missed);

  return { banked, spent, balance: banked - spent };
}

/** "12 day streak" / "1 day streak" / "No streak yet". */
export function streakLabel(streak: number, habit: HabitSchedule): string {
  if (streak === 0) return 'No streak yet';

  if (habit.frequency_type === 'weekly_target') {
    return streak === 1 ? '1 week in a row' : `${streak} weeks in a row`;
  }

  return streak === 1 ? '1 day streak' : `${streak} day streak`;
}

export type AdaptiveTarget = { suggested: number | null; reason: string };

/** Suggests a new weekly target after three weeks of consistent (or poor) results. */
export function adaptiveTarget(
  habit: HabitSchedule,
  logs: Set<string>,
  today: Date,
): AdaptiveTarget {
  if (habit.frequency_type !== 'weekly_target') {
    return { suggested: null, reason: '' };
  }

  const current = habit.target_per_week ?? 3;
  const thisWeek = weekStart(startOfDay(today));

  const hits = [1, 2, 3].map((index) => {
    const start = addDays(thisWeek, -7 * index);
    const days = weekDays(start);
    const done = days.filter((day) => logs.has(toDateString(day))).length;
    return done >= current;
  });

  const hitCount = hits.filter(Boolean).length;

  if (hitCount === 3 && current < 7) {
    return { suggested: current + 1, reason: 'You hit your target 3 weeks running.' };
  }
  if (hitCount <= 1 && current > 1) {
    return { suggested: current - 1, reason: 'A lower target may fit better right now.' };
  }
  return { suggested: null, reason: '' };
}
