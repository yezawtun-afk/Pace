/**
 * Pure helpers for the Today screen.
 *
 * Today is a combination of two other screens, so the rule "what belongs on
 * today's list" lives here instead of inside the screen:
 *
 *   habits  scheduled for this weekday, plus anything already checked in
 *           (a rest day you chose to do anyway still deserves to show up)
 *   tasks   whatever the server returns for the `today` view — due today,
 *           overdue, and things finished earlier today
 *
 * Nothing here touches React or Supabase, so `npm test` covers it directly.
 */

import { toDateString } from '@/lib/dates';
import { isScheduledOn } from '@/features/habits/schedule';
import type { Habit, Task } from '@/types/database';

export type TodayHabit = {
  habit: Habit;
  /** Checked in on this exact calendar day. */
  done: boolean;
  /** Today is not one of its scheduled days, but it was checked in anyway. */
  restDay: boolean;
};

/**
 * Habits that belong on today's list, in the order they were created.
 *
 * A weekly-target habit is scheduled every day (any day can count), while a
 * "chosen days" habit stays out of Today on its rest days unless it was done.
 */
export function habitsForToday(
  habits: Habit[],
  doneByHabit: Map<string, Set<string>>,
  today: Date,
): TodayHabit[] {
  const key = toDateString(today);
  const result: TodayHabit[] = [];

  for (const habit of habits) {
    const done = doneByHabit.get(habit.id)?.has(key) ?? false;
    const scheduled = isScheduledOn(habit, today);

    if (scheduled || done) {
      result.push({ habit, done, restDay: !scheduled });
    }
  }

  return result;
}

export type TodayProgress = {
  /** Habits and tasks finished today. */
  done: number;
  /** Everything on today's list. */
  total: number;
  remaining: number;
  habitDone: number;
  habitTotal: number;
  taskDone: number;
  taskTotal: number;
  /** 0 to 1, ready for the progress ring. */
  ratio: number;
};

/** Counts both lists into the one number the ring shows. */
export function todayProgress(habits: TodayHabit[], tasks: Task[]): TodayProgress {
  const habitTotal = habits.length;
  const habitDone = habits.filter((entry) => entry.done).length;
  const taskTotal = tasks.length;
  const taskDone = tasks.filter((task) => task.completed).length;

  const done = habitDone + taskDone;
  const total = habitTotal + taskTotal;

  return {
    done,
    total,
    remaining: total - done,
    habitDone,
    habitTotal,
    taskDone,
    taskTotal,
    ratio: total === 0 ? 0 : done / total,
  };
}

/** "Good morning" / "Good afternoon" / "Good evening". */
export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The name to greet. "Guest" is deliberately ignored — "Good morning, Guest"
 * sounds like a form letter, and the generic greeting is warmer.
 */
export function greetingName(displayName: string | null | undefined): string | null {
  const name = displayName?.trim();
  if (!name || name.toLowerCase() === 'guest') return null;
  return name.split(' ')[0];
}
