import type { Habit, Task } from '@/types/database';

import { greetingFor, greetingName, habitsForToday, todayProgress } from '../summary';

/** 10 November 2026 is a Tuesday. */
const TUESDAY = new Date(2026, 10, 10);
const FRIDAY = new Date(2026, 10, 13);

/** A habit row with sensible defaults; override only what a test cares about. */
function makeHabit(overrides: Partial<Habit>): Habit {
  return {
    id: 'habit-1',
    user_id: 'user-1',
    name: 'Read',
    icon: null,
    color: '#8aa888',
    frequency_type: 'daily',
    frequency_days: [],
    target_per_week: null,
    reminder_time: null,
    archived: false,
    created_at: '2026-11-01T00:00:00.000Z',
    updated_at: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

/** A task row with sensible defaults. */
function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'task-1',
    user_id: 'user-1',
    category_id: null,
    title: 'Water the plants',
    notes: null,
    due_date: '2026-11-10',
    due_time: null,
    priority: 4,
    completed: false,
    completed_at: null,
    created_at: '2026-11-10T08:00:00.000Z',
    updated_at: '2026-11-10T08:00:00.000Z',
    ...overrides,
  };
}

/** The map shape the Today screen builds from the habit log query. */
function doneMap(entries: Record<string, string[]>): Map<string, Set<string>> {
  return new Map(Object.entries(entries).map(([habitId, dates]) => [habitId, new Set(dates)]));
}

describe('habitsForToday', () => {
  it('includes a daily habit and marks it as scheduled', () => {
    const result = habitsForToday([makeHabit({})], new Map(), TUESDAY);

    expect(result).toHaveLength(1);
    expect(result[0].done).toBe(false);
    expect(result[0].restDay).toBe(false);
  });

  it('leaves out a weekday habit on a day it is not scheduled', () => {
    const wednesdayOnly = makeHabit({ frequency_type: 'weekdays', frequency_days: [3] });

    expect(habitsForToday([wednesdayOnly], new Map(), TUESDAY)).toEqual([]);
    expect(habitsForToday([wednesdayOnly], new Map(), FRIDAY)).toHaveLength(0);
  });

  it('keeps a rest-day habit that was checked in anyway, flagged as a rest day', () => {
    const wednesdayOnly = makeHabit({ id: 'wed', frequency_type: 'weekdays', frequency_days: [3] });
    const logs = doneMap({ wed: ['2026-11-10'] });

    const result = habitsForToday([wednesdayOnly], logs, TUESDAY);

    expect(result).toHaveLength(1);
    expect(result[0].done).toBe(true);
    expect(result[0].restDay).toBe(true);
  });

  it('shows a weekly-target habit every day', () => {
    const threePerWeek = makeHabit({ frequency_type: 'weekly_target', target_per_week: 3 });

    expect(habitsForToday([threePerWeek], new Map(), TUESDAY)).toHaveLength(1);
  });

  it('reads today from the right calendar day', () => {
    const daily = makeHabit({ id: 'read' });
    const logs = doneMap({ read: ['2026-11-09'] });

    const result = habitsForToday([daily], logs, TUESDAY);

    expect(result[0].done).toBe(false);
  });

  it('keeps the order the habits come in', () => {
    const habits = [makeHabit({ id: 'a', name: 'A' }), makeHabit({ id: 'b', name: 'B' })];

    expect(habitsForToday(habits, new Map(), TUESDAY).map((entry) => entry.habit.name)).toEqual([
      'A',
      'B',
    ]);
  });
});

describe('todayProgress', () => {
  it('counts habits and tasks into one total', () => {
    const habits = habitsForToday(
      [makeHabit({ id: 'a' }), makeHabit({ id: 'b' })],
      doneMap({ a: ['2026-11-10'] }),
      TUESDAY,
    );
    const tasks = [
      makeTask({ id: 't1', completed: false }),
      makeTask({ id: 't2', completed: true }),
      makeTask({ id: 't3', completed: false }),
    ];

    const progress = todayProgress(habits, tasks);

    expect(progress.habitDone).toBe(1);
    expect(progress.habitTotal).toBe(2);
    expect(progress.taskDone).toBe(1);
    expect(progress.taskTotal).toBe(3);
    expect(progress.done).toBe(2);
    expect(progress.total).toBe(5);
    expect(progress.remaining).toBe(3);
    expect(progress.ratio).toBeCloseTo(2 / 5);
  });

  it('reports an empty day as nothing done and a zero ratio', () => {
    const progress = todayProgress([], []);

    expect(progress.total).toBe(0);
    expect(progress.remaining).toBe(0);
    expect(progress.ratio).toBe(0);
  });

  it('reaches a full ratio when everything is checked off', () => {
    const habits = habitsForToday(
      [makeHabit({ id: 'a' })],
      doneMap({ a: ['2026-11-10'] }),
      TUESDAY,
    );

    const progress = todayProgress(habits, [makeTask({ completed: true })]);

    expect(progress.remaining).toBe(0);
    expect(progress.ratio).toBe(1);
  });
});

describe('greetingFor', () => {
  it('greets by time of day', () => {
    const at = (hour: number) => greetingFor(new Date(2026, 10, 10, hour, 30));

    expect(at(0)).toBe('Good morning');
    expect(at(11)).toBe('Good morning');
    expect(at(12)).toBe('Good afternoon');
    expect(at(17)).toBe('Good afternoon');
    expect(at(18)).toBe('Good evening');
    expect(at(23)).toBe('Good evening');
  });
});

describe('greetingName', () => {
  it('uses only the first name', () => {
    expect(greetingName('Ada Lovelace')).toBe('Ada');
  });

  it('ignores blank names and the guest label', () => {
    expect(greetingName(null)).toBeNull();
    expect(greetingName(undefined)).toBeNull();
    expect(greetingName('   ')).toBeNull();
    expect(greetingName('Guest')).toBeNull();
    expect(greetingName('guest')).toBeNull();
  });

  it('trims stray spaces', () => {
    expect(greetingName('  Ada  ')).toBe('Ada');
  });
});
