import type { HabitSchedule } from '../schedule';
import {
  completionRate,
  currentStreak,
  daysSinceLastCompletion,
  doneKeys,
  expectedCount,
  lastDays,
  ratePercent,
  restDayBank,
  rustOpacity,
  streakLabel,
  todayState,
  weekBuckets,
} from '../stats';

/** 10 November 2026 is a Tuesday. */
const TUESDAY = new Date(2026, 10, 10);
const WEDNESDAY = new Date(2026, 10, 11);
const FRIDAY = new Date(2026, 10, 13);
const SUNDAY = new Date(2026, 10, 15);

const daily: HabitSchedule = {
  frequency_type: 'daily',
  frequency_days: [],
  target_per_week: null,
};

const monWedFri: HabitSchedule = {
  frequency_type: 'weekdays',
  frequency_days: [1, 3, 5],
  target_per_week: null,
};

const threePerWeek: HabitSchedule = {
  frequency_type: 'weekly_target',
  frequency_days: [],
  target_per_week: 3,
};

/** Log dates as a Set, which is what every stat function expects. */
function done(...dates: string[]): Set<string> {
  return new Set(dates);
}

describe('lastDays and doneKeys', () => {
  it('returns the last N days oldest first, ending today', () => {
    const days = lastDays(3, TUESDAY);
    expect(days.map((day) => day.getDate())).toEqual([8, 9, 10]);
  });

  it('turns log rows into a set of calendar days', () => {
    const keys = doneKeys([{ log_date: '2026-11-09' }, { log_date: '2026-11-10' }]);
    expect(keys.has('2026-11-09')).toBe(true);
    expect(keys.has('2026-11-08')).toBe(false);
  });
});

describe('currentStreak â€” daily', () => {
  it('counts consecutive completed days, including today', () => {
    expect(currentStreak(daily, done('2026-11-10', '2026-11-09', '2026-11-08'), TUESDAY)).toBe(3);
  });

  it('does not break when today is still unfinished', () => {
    expect(currentStreak(daily, done('2026-11-09', '2026-11-08'), TUESDAY)).toBe(2);
  });

  it('breaks at the first missed day', () => {
    expect(currentStreak(daily, done('2026-11-10', '2026-11-08'), TUESDAY)).toBe(1);
  });

  it('is zero when nothing has ever been logged', () => {
    expect(currentStreak(daily, done(), TUESDAY)).toBe(0);
  });
});

describe('currentStreak â€” chosen weekdays', () => {
  it('skips rest days instead of breaking on them', () => {
    // Fri 13, Wed 11, Mon 9, Fri 6 â€” Tue/Thu/Sat/Sun are rest days.
    expect(
      currentStreak(
        monWedFri,
        done('2026-11-13', '2026-11-11', '2026-11-09', '2026-11-06'),
        FRIDAY,
      ),
    ).toBe(4);
  });

  it('breaks when a scheduled day was missed', () => {
    // Wednesday 11 was scheduled but is missing.
    expect(currentStreak(monWedFri, done('2026-11-13', '2026-11-09', '2026-11-06'), FRIDAY)).toBe(
      1,
    );
  });

  it('never breaks on a rest day, even when today is one', () => {
    expect(currentStreak(monWedFri, done('2026-11-13', '2026-11-11', '2026-11-09'), SUNDAY)).toBe(
      3,
    );
  });

  it('counts a rest day that was checked in anyway', () => {
    // Tuesday is a rest day, but a real completion still counts.
    expect(currentStreak(monWedFri, done('2026-11-10'), TUESDAY)).toBe(1);
    expect(currentStreak(monWedFri, done('2026-11-10', '2026-11-09'), TUESDAY)).toBe(2);
  });
});

describe('currentStreak â€” weekly target', () => {
  it('counts weeks that reached the target, including the open one', () => {
    // This week: 9, 10, 11 (3). Last week: 2, 3, 4 (3).
    expect(
      currentStreak(
        threePerWeek,
        done('2026-11-09', '2026-11-10', '2026-11-11', '2026-11-02', '2026-11-03', '2026-11-04'),
        WEDNESDAY,
      ),
    ).toBe(2);
  });

  it('does not break the streak while the current week is still open', () => {
    // This week has 2 of 3; last week is complete.
    expect(
      currentStreak(
        threePerWeek,
        done('2026-11-09', '2026-11-10', '2026-11-02', '2026-11-03', '2026-11-04'),
        WEDNESDAY,
      ),
    ).toBe(1);
  });

  it('breaks on a finished week that fell short', () => {
    // This week is complete, last week only reached 2 of 3.
    expect(
      currentStreak(
        threePerWeek,
        done('2026-11-09', '2026-11-10', '2026-11-11', '2026-11-02', '2026-11-03'),
        WEDNESDAY,
      ),
    ).toBe(1);
  });
});

describe('expectedCount and completionRate', () => {
  it('expects one completion a day for a daily habit', () => {
    expect(expectedCount(daily, lastDays(7, TUESDAY))).toBe(7);
  });

  it('expects only scheduled days for a weekday habit', () => {
    // Wed 4, Fri 6, Mon 9 are the scheduled days in the last 7 days.
    expect(expectedCount(monWedFri, lastDays(7, TUESDAY))).toBe(3);
  });

  it('scales a weekly target to the window', () => {
    expect(expectedCount(threePerWeek, lastDays(7, TUESDAY))).toBe(3);
  });

  it('divides completions by expectations', () => {
    const sevenDays = lastDays(7, TUESDAY);

    expect(
      completionRate(daily, done('2026-11-10', '2026-11-08', '2026-11-06'), sevenDays),
    ).toBeCloseTo(3 / 7);
    expect(completionRate(monWedFri, done('2026-11-09', '2026-11-06'), sevenDays)).toBeCloseTo(
      2 / 3,
    );
    expect(completionRate(threePerWeek, done('2026-11-10', '2026-11-08'), sevenDays)).toBeCloseTo(
      2 / 3,
    );
  });

  it('never reports more than 100%, even with extra check-ins', () => {
    const sevenDays = lastDays(7, TUESDAY);
    const everyDay = done(
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
    );

    expect(completionRate(monWedFri, everyDay, sevenDays)).toBe(1);
  });

  it('reports whole percentages for the detail screen', () => {
    const half = done(
      ...lastDays(30, TUESDAY)
        .slice(0, 15)
        .map((day) => {
          const month = String(day.getMonth() + 1).padStart(2, '0');
          const date = String(day.getDate()).padStart(2, '0');
          return `${day.getFullYear()}-${month}-${date}`;
        }),
    );

    expect(ratePercent(daily, half, 30, TUESDAY)).toBe(50);
  });
});

describe('todayState', () => {
  it('knows done, todo and rest days', () => {
    expect(todayState(daily, done(), TUESDAY)).toBe('todo');
    expect(todayState(daily, done('2026-11-10'), TUESDAY)).toBe('done');
    expect(todayState(monWedFri, done(), TUESDAY)).toBe('rest');
    // A rest day can still be checked in.
    expect(todayState(monWedFri, done('2026-11-10'), TUESDAY)).toBe('done');
  });
});

describe('weekBuckets', () => {
  it('returns the last eight weeks, oldest first, with the current one last', () => {
    const buckets = weekBuckets(daily, done(), WEDNESDAY, 8);

    expect(buckets).toHaveLength(8);
    expect(buckets.filter((bucket) => bucket.current)).toHaveLength(1);
    expect(buckets[buckets.length - 1].current).toBe(true);
    expect(buckets[0].start).toBe('2026-09-21'); // Monday 8 weeks back
  });

  it('only counts the days that have already happened this week', () => {
    const buckets = weekBuckets(daily, done('2026-11-09', '2026-11-11'), WEDNESDAY, 3);

    expect(buckets.map((bucket) => bucket.expected)).toEqual([7, 7, 3]);
    expect(buckets[2].done).toBe(2);
    expect(buckets[1].done).toBe(0);
  });

  it('counts a weekday habit only on its scheduled days', () => {
    const buckets = weekBuckets(monWedFri, done('2026-11-09', '2026-11-11'), WEDNESDAY, 2);

    // Last week has Mon/Wed/Fri; this week only Mon and Wed so far.
    expect(buckets[0].expected).toBe(3);
    expect(buckets[1].expected).toBe(2);
    expect(buckets[1].done).toBe(2);
  });
});

describe('streakLabel', () => {
  it('reads naturally for days and weeks', () => {
    expect(streakLabel(0, daily)).toBe('No streak yet');
    expect(streakLabel(1, daily)).toBe('1 day streak');
    expect(streakLabel(5, daily)).toBe('5 day streak');
    expect(streakLabel(1, threePerWeek)).toBe('1 week in a row');
    expect(streakLabel(4, threePerWeek)).toBe('4 weeks in a row');
  });
});

describe('rustOpacity', () => {
  it('stays full for the first three days', () => {
    expect(rustOpacity(0)).toBe(1);
    expect(rustOpacity(3)).toBe(1);
  });

  it('fades to 0.4 by day 14', () => {
    expect(rustOpacity(14)).toBeCloseTo(0.4);
  });

  it('never goes below 0.4', () => {
    expect(rustOpacity(100)).toBeCloseTo(0.4);
  });

  it('treats never-done as fully faded', () => {
    expect(rustOpacity(Infinity)).toBeCloseTo(0.4);
  });
});

describe('daysSinceLastCompletion', () => {
  it('is 0 when done today', () => {
    expect(daysSinceLastCompletion(done('2026-11-10'), TUESDAY)).toBe(0);
  });

  it('counts back to the last done day', () => {
    expect(daysSinceLastCompletion(done('2026-11-08'), TUESDAY)).toBe(2);
  });

  it('is Infinity when never done', () => {
    expect(daysSinceLastCompletion(done(), TUESDAY)).toBe(Infinity);
  });
});

describe('restDayBank', () => {
  it('banks a rest day for a week that hit its target', () => {
    // TUESDAY is 10 Nov 2026; last four completed weeks before it.
    const logs = done('2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07');
    const bank = restDayBank(daily, logs, new Date(2026, 10, 10));
    expect(bank.banked).toBeGreaterThanOrEqual(1);
  });

  it('banks nothing when nothing was done', () => {
    const bank = restDayBank(daily, done(), TUESDAY);
    expect(bank.banked).toBe(0);
    expect(bank.balance).toBe(0);
  });

  it('spends a banked day to cover a recent miss', () => {
    // Done every day last week (bank 1), missed today.
    const lastWeek = [
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
    ];
    const bank = restDayBank(daily, done(...lastWeek), new Date(2026, 10, 10));
    expect(bank.spent).toBe(1);
    expect(bank.balance).toBe(bank.banked - 1);
  });

  it('never spends more than it banked', () => {
    const bank = restDayBank(daily, done(), TUESDAY);
    expect(bank.spent).toBe(0);
  });
});
