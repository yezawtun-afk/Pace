import { moodHabitInsight } from '../correlation';
import type { DaySummary } from '../correlation';

function day(date: string, mood: number | null, done: number, total: number): DaySummary {
  return { date, mood, done, total };
}

describe('moodHabitInsight', () => {
  it('returns null until both buckets have enough days', () => {
    const days: DaySummary[] = [day('2026-01-01', 5, 3, 3), day('2026-01-02', 5, 3, 3)];
    expect(moodHabitInsight(days)).toBeNull();
  });

  it('ignores days with no habits scheduled', () => {
    const days: DaySummary[] = [
      ...Array.from({ length: 4 }, (_, i) => day(`2026-01-0${i + 1}`, 5, 2, 2)),
      ...Array.from({ length: 4 }, (_, i) => day(`2026-01-1${i}`, 1, 0, 0)),
    ];
    expect(moodHabitInsight(days)).toBeNull();
  });

  it('ignores neutral moods (3) in both buckets', () => {
    const days: DaySummary[] = [
      ...Array.from({ length: 4 }, (_, i) => day(`2026-01-0${i + 1}`, 5, 3, 3)),
      ...Array.from({ length: 4 }, (_, i) => day(`2026-01-1${i}`, 3, 0, 3)),
    ];
    expect(moodHabitInsight(days)).toBeNull();
  });

  it('computes the completion rates and the gap', () => {
    const days: DaySummary[] = [
      ...Array.from({ length: 4 }, (_, i) => day(`2026-01-0${i + 1}`, 4, 3, 3)), // 100%
      ...Array.from({ length: 4 }, (_, i) => day(`2026-01-1${i}`, 1, 1, 2)), // 50%
    ];

    const insight = moodHabitInsight(days);

    expect(insight).not.toBeNull();
    expect(insight!.positiveDays).toBe(4);
    expect(insight!.negativeDays).toBe(4);
    expect(insight!.positiveRate).toBe(1);
    expect(insight!.negativeRate).toBe(0.5);
    expect(insight!.delta).toBe(0.5);
  });

  it('handles partial completion on good days', () => {
    const days: DaySummary[] = [
      day('2026-01-01', 5, 1, 2),
      day('2026-01-02', 4, 1, 2),
      day('2026-01-03', 5, 2, 2),
      day('2026-01-04', 4, 2, 2),
      day('2026-01-05', 1, 0, 2),
      day('2026-01-06', 2, 1, 2),
      day('2026-01-07', 1, 0, 2),
      day('2026-01-08', 2, 1, 2),
    ];

    const insight = moodHabitInsight(days);

    expect(insight!.positiveRate).toBeCloseTo(0.75);
    expect(insight!.negativeRate).toBeCloseTo(0.25);
  });
});
