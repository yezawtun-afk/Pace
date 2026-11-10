import {
  isScheduledOn,
  monthLabel,
  monthWeeks,
  scheduleLabel,
  sortedDays,
  weekDays,
  WEEK_ORDER,
} from '../schedule';

/** 10 November 2026 is a Tuesday; 9 November is the Monday of that week. */
const TUESDAY = new Date(2026, 10, 10);
const MONDAY = new Date(2026, 10, 9);

const daily = {
  frequency_type: 'daily' as const,
  frequency_days: [] as number[],
  target_per_week: null,
};
const monWedFri = {
  frequency_type: 'weekdays' as const,
  frequency_days: [1, 3, 5],
  target_per_week: null,
};
const weekly = {
  frequency_type: 'weekly_target' as const,
  frequency_days: [] as number[],
  target_per_week: 3,
};

describe('isScheduledOn', () => {
  it('schedules a daily habit every day of the week', () => {
    for (let day = 0; day < 7; day += 1) {
      expect(isScheduledOn(daily, new Date(2026, 10, 8 + day))).toBe(true);
    }
  });

  it('only schedules chosen weekdays', () => {
    expect(isScheduledOn(monWedFri, MONDAY)).toBe(true);
    expect(isScheduledOn(monWedFri, TUESDAY)).toBe(false);
    expect(isScheduledOn(monWedFri, new Date(2026, 10, 11))).toBe(true); // Wednesday
    expect(isScheduledOn(monWedFri, new Date(2026, 10, 15))).toBe(false); // Sunday
  });

  it('lets a weekly target be met on any day', () => {
    expect(isScheduledOn(weekly, TUESDAY)).toBe(true);
    expect(isScheduledOn(weekly, new Date(2026, 10, 15))).toBe(true);
  });
});

describe('sortedDays', () => {
  it('orders days Monday first, no matter how they were stored', () => {
    expect(sortedDays([0, 6, 1])).toEqual([1, 6, 0]);
    expect(sortedDays([3, 1, 2])).toEqual([1, 2, 3]);
    expect(WEEK_ORDER[0]).toBe(1);
  });
});

describe('scheduleLabel', () => {
  it('describes the three schedule types', () => {
    expect(scheduleLabel(daily)).toBe('Every day');
    expect(scheduleLabel(monWedFri)).toBe('Mon, Wed, Fri');
    expect(scheduleLabel(weekly)).toBe('3× per week');
  });

  it('uses friendly names for the common patterns', () => {
    expect(
      scheduleLabel({
        frequency_type: 'weekdays',
        frequency_days: [1, 2, 3, 4, 5],
        target_per_week: null,
      }),
    ).toBe('Weekdays only');

    expect(
      scheduleLabel({
        frequency_type: 'weekdays',
        frequency_days: [6, 0],
        target_per_week: null,
      }),
    ).toBe('Weekends only');

    expect(
      scheduleLabel({
        frequency_type: 'weekdays',
        frequency_days: [0, 1, 2, 3, 4, 5, 6],
        target_per_week: null,
      }),
    ).toBe('Every day');
  });

  it('admits when no weekday was chosen', () => {
    expect(
      scheduleLabel({ frequency_type: 'weekdays', frequency_days: [], target_per_week: null }),
    ).toBe('No days chosen');
  });
});

describe('weekDays', () => {
  it('returns Monday to Sunday for any date in the week', () => {
    const days = weekDays(TUESDAY);

    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1); // Monday
    expect(days[6].getDay()).toBe(0); // Sunday
    expect(days[0].getDate()).toBe(9);
    expect(days[6].getDate()).toBe(15);
  });
});

describe('monthWeeks', () => {
  it('always returns six full weeks starting on a Monday', () => {
    const weeks = monthWeeks(new Date(2026, 10, 1));

    expect(weeks).toHaveLength(6);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
      expect(week[0].getDay()).toBe(1);
      expect(week[6].getDay()).toBe(0);
    }
  });

  it('includes the whole month, even when it starts mid-week', () => {
    // 1 November 2026 is a Sunday, so the grid has to begin in October.
    const weeks = monthWeeks(new Date(2026, 10, 1));
    const dates = weeks.flat().map((day) => day.getDate());

    expect(dates).toContain(1);
    expect(dates).toContain(30); // 30 November
    expect(weeks[0][0].getMonth()).toBe(9); // October
  });

  it('labels a month with its name and year', () => {
    expect(monthLabel(new Date(2026, 10, 1))).toBe('November 2026');
  });
});
