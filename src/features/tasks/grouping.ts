/**
 * Pure helpers for the task list: dates, sorting and grouping.
 *
 * No React and no Supabase in this file, so the rules that decide "what counts
 * as overdue" and "in what order do rows appear" can be tested on their own.
 *
 * A task's `due_date` is a calendar day ("2026-11-10"), not an instant, so
 * everything here compares calendar days in the device's time zone.
 */

import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';

import type { Task } from '@/types/database';

export type TaskView = 'today' | 'upcoming' | 'all' | 'done';

/** "2026-11-10" for the device's current day. */
export function todayString(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd');
}

/** The same calendar day as a `yyyy-MM-dd` string. */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Midnight today as a real instant — used for "completed today" filters. */
export function startOfTodayIso(now: Date = new Date()): string {
  return startOfDay(now).toISOString();
}

/** A due date that has already passed (yesterday or earlier). */
export function isOverdue(task: Task, now: Date = new Date()): boolean {
  if (!task.due_date) return false;
  return task.due_date < todayString(now);
}

/**
 * The order rows appear in, everywhere:
 * earliest date first (undated last), then P1 before P2, then earlier time
 * first (no time last), then oldest first so the list does not jump around.
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.due_date !== b.due_date) {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date < b.due_date ? -1 : 1;
    }

    if (a.priority !== b.priority) return a.priority - b.priority;

    const timeA = a.due_time ?? '99:99:99';
    const timeB = b.due_time ?? '99:99:99';
    if (timeA !== timeB) return timeA < timeB ? -1 : 1;

    return a.created_at < b.created_at ? -1 : 1;
  });
}

/**
 * Friendly name for a calendar day: "Today", "Tomorrow", "Friday",
 * "Fri 14 Nov", and the year only when it is not this year.
 */
export function dayLabel(dateString: string, now: Date = new Date()): string {
  const date = parseISO(dateString);
  const diff = differenceInCalendarDays(date, now);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return format(date, 'EEEE');
  if (date.getFullYear() === now.getFullYear()) return format(date, 'EEE d MMM');
  return format(date, 'd MMM yyyy');
}

/**
 * Short due-date text for a row: "Today", "Overdue · 3 days", "Fri 14 Nov".
 * Returns null for tasks without a date, so the caller can stay quiet about it.
 */
export function dueLabel(task: Task, now: Date = new Date()): string | null {
  if (!task.due_date) return null;

  if (isOverdue(task, now)) {
    const days = differenceInCalendarDays(parseISO(todayString(now)), parseISO(task.due_date));
    if (days === 1) return 'Overdue · 1 day';
    if (days < 14) return `Overdue · ${days} days`;
    return `Overdue · ${format(parseISO(task.due_date), 'd MMM')}`;
  }

  return dayLabel(task.due_date, now);
}

export type TaskGroup = {
  /** Stable key for React. */
  key: string;
  /** Empty for the flat views (All / Done), where no heading is drawn. */
  title: string;
  /** True when this group is the "Overdue" one, so the heading can be tinted. */
  overdue?: boolean;
  tasks: Task[];
};

/**
 * Splits a sorted list into the groups the UI draws:
 * - Today: "Overdue" then "Today".
 * - Upcoming: one group per day.
 * - All / Done: a single untitled group.
 */
export function groupTasks(view: TaskView, tasks: Task[], now: Date = new Date()): TaskGroup[] {
  const sorted = sortTasks(tasks);

  if (view === 'today') {
    const today = todayString(now);
    const overdue = sorted.filter((task) => task.due_date !== null && task.due_date < today);
    const dueToday = sorted.filter((task) => task.due_date === today);
    const groups: TaskGroup[] = [];

    if (overdue.length > 0) {
      groups.push({ key: 'overdue', title: 'Overdue', overdue: true, tasks: overdue });
    }
    if (dueToday.length > 0) {
      groups.push({ key: 'today', title: 'Today', tasks: dueToday });
    }
    return groups;
  }

  if (view === 'upcoming') {
    const byDay = new Map<string, Task[]>();
    for (const task of sorted) {
      if (!task.due_date) continue;
      const day = task.due_date;
      byDay.set(day, [...(byDay.get(day) ?? []), task]);
    }

    return [...byDay.entries()].map(([day, dayTasks]) => ({
      key: day,
      title: dayLabel(day, now),
      tasks: dayTasks,
    }));
  }

  return sorted.length > 0 ? [{ key: view, title: '', tasks: sorted }] : [];
}

/** "3 tasks" / "1 task" — used next to a heading. */
export function taskCountLabel(count: number): string {
  return count === 1 ? '1 task' : `${count} tasks`;
}
