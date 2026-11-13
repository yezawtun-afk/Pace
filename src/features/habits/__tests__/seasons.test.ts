import { seasonProgress, seasonLabel, seasonQuote } from '../seasons';
import type { JournalEntry } from '@/types/database';

function entry(date: string, body: string): JournalEntry {
  return {
    id: date,
    user_id: 'u',
    entry_date: date,
    title: null,
    body,
    mood: 4,
    prompt_text: null,
    created_at: date,
    updated_at: date,
  };
}

describe('seasonProgress', () => {
  it('starts at day 1', () => {
    const today = new Date(2026, 10, 10);
    const progress = seasonProgress('2026-11-10', today);
    expect(progress.day).toBe(1);
    expect(progress.complete).toBe(false);
    expect(progress.remaining).toBe(30);
  });

  it('counts up to day 30', () => {
    const today = new Date(2026, 11, 9); // 30 days after 10 Nov
    const progress = seasonProgress('2026-11-10', today);
    expect(progress.day).toBe(30);
    expect(progress.complete).toBe(false);
  });

  it('marks complete after day 30', () => {
    const today = new Date(2026, 11, 10);
    const progress = seasonProgress('2026-11-10', today);
    expect(progress.complete).toBe(true);
    expect(progress.day).toBe(30);
  });

  it('treats a null start as day 1', () => {
    const today = new Date(2026, 10, 10);
    const progress = seasonProgress(null, today);
    expect(progress.day).toBe(1);
  });
});

describe('seasonLabel', () => {
  it('labels an in-progress season', () => {
    expect(seasonLabel('2026-11-10', new Date(2026, 10, 10))).toBe('Day 1 of 30');
  });

  it('labels a complete season', () => {
    expect(seasonLabel('2026-11-10', new Date(2026, 11, 10))).toBe('Season complete');
  });
});

describe('seasonQuote', () => {
  it('returns null when there are no entries', () => {
    expect(seasonQuote([], '2026-11-10', new Date(2026, 10, 10))).toBeNull();
  });

  it('prefers entries inside the season', () => {
    const quote = seasonQuote(
      [entry('2026-11-10', 'A line from inside the season.')],
      '2026-11-10',
      new Date(2026, 10, 10),
    );
    expect(quote).toBe('A line from inside the season.');
  });

  it('truncates long entries', () => {
    const long = 'a'.repeat(200);
    const quote = seasonQuote([entry('2026-11-10', long)], '2026-11-10', new Date(2026, 10, 10));
    expect(quote!.length).toBeLessThanOrEqual(140);
  });
});
