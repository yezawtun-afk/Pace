/**
 * Pure scheduling helpers for habits.
 *
 * A habit repeats in one of three ways:
 *
 *   daily         every day
 *   weekdays      only on chosen weekdays (`frequency_days`, 0 = Sunday)
 *   weekly_target any day, as long as the week reaches `target_per_week`
 *
 * Nothing in this file touches React or Supabase, so the rules can be tested
 * directly. Weeks run Monday→Sunday everywhere, matching the heatmap and the
 * "T W T F S S" weekday row.
 */

import { addDays, eachDayOfInterval, format, startOfWeek } from 'date-fns';

import type { Habit } from '@/types/database';

import { toDateString } from '@/lib/dates';

export type HabitSchedule = Pick<Habit, 'frequency_type' | 'frequency_days' | 'target_per_week'>;

/** Monday-first weekday order used by the pickers. date-fns: 0 = Sunday. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  0: 'Sunday',
};

/** Is this habit meant to be done on this calendar day? */
export function isScheduledOn(habit: HabitSchedule, date: Date): boolean {
  if (habit.frequency_type === 'daily') return true;
  if (habit.frequency_type === 'weekdays') return habit.frequency_days.includes(date.getDay());
  // A weekly target can be met on any day, so every day counts.
  return true;
}

/** Chosen weekdays in Monday-first order. */
export function sortedDays(days: number[]): number[] {
  return WEEK_ORDER.filter((day) => days.includes(day));
}

/**
 * Short schedule description: "Every day", "Mon, Wed, Fri", "3× per week".
 */
export function scheduleLabel(habit: HabitSchedule): string {
  if (habit.frequency_type === 'daily') return 'Every day';

  if (habit.frequency_type === 'weekdays') {
    const days = sortedDays(habit.frequency_days);

    if (days.length === 0) return 'No days chosen';
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) {
      return 'Weekdays only';
    }
    if (days.length === 2 && days.includes(6) && days.includes(0)) return 'Weekends only';

    const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day) => short[day]).join(', ');
  }

  const target = habit.target_per_week ?? 1;
  return `${target}× per week`;
}

/** Midnight on the Monday of the week containing `date`. */
export function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/** The seven days of the week containing `date`, Monday first. */
export function weekDays(date: Date): Date[] {
  const start = weekStart(date);
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

/**
 * A calendar month as full weeks, Monday first. Always six rows of seven so the
 * grid never changes height when moving between months.
 */
export function monthWeeks(month: Date): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = weekStart(first);
  const days = eachDayOfInterval({ start: gridStart, end: addDays(gridStart, 41) });

  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

/** Month name plus year, e.g. "November 2026". */
export function monthLabel(month: Date): string {
  return format(month, 'MMMM yyyy');
}

/** "2026-11-10" keys for a list of dates, ready for a Set. */
export function dateKeys(dates: Date[]): string[] {
  return dates.map(toDateString);
}
