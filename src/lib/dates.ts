/**
 * Calendar-day helpers shared by tasks and habits.
 *
 * `date` columns in Postgres store a calendar day ("2026-11-10"), not an
 * instant, so everything here works in the device's own time zone and never
 * converts to UTC. Keeping these in one place means "today" means the same
 * thing on every screen.
 */

import { format, parseISO, startOfDay } from 'date-fns';

/** "2026-11-10" for the device's current day. */
export function todayString(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd');
}

/** The same calendar day written as a `yyyy-MM-dd` string. */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** "2026-11-10" -> a Date at local midnight. */
export function fromDateString(value: string): Date {
  return startOfDay(parseISO(value));
}

/** Midnight today as a real instant — used for "completed today" filters. */
export function startOfTodayIso(now: Date = new Date()): string {
  return startOfDay(now).toISOString();
}
