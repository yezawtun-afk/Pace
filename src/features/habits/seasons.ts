import { addDays, differenceInCalendarDays, format } from 'date-fns';

import { toDateString } from '@/lib/dates';
import type { JournalEntry } from '@/types/database';

export const SEASON_LENGTH = 30;

export type SeasonProgress = {
  /** Day within the season, 1-based. */
  day: number;
  total: number;
  /** Days remaining including today. */
  remaining: number;
  /** True once the 30 days are up. */
  complete: boolean;
};

/**
 * Where we are inside the current 30-day chapter. A null start is treated as
 * "just begun", so a profile that has not been migrated yet never crashes.
 */
export function seasonProgress(start: string | null, today: Date): SeasonProgress {
  const startDate = start ? new Date(start + 'T00:00:00') : today;
  const day = Math.max(1, differenceInCalendarDays(today, startDate) + 1);
  const complete = day > SEASON_LENGTH;
  const remaining = Math.max(0, SEASON_LENGTH - day + 1);

  return {
    day: Math.min(day, SEASON_LENGTH),
    total: SEASON_LENGTH,
    remaining,
    complete,
  };
}

export function seasonLabel(start: string | null, today: Date): string {
  const progress = seasonProgress(start, today);
  if (progress.complete) return 'Season complete';
  return `Day ${progress.day} of ${progress.total}`;
}

/** The first day of the season, or null when there is no start yet. */
export function seasonStartDate(start: string | null): Date | null {
  return start ? new Date(start + 'T00:00:00') : null;
}

/** Pick a short quote from the season's journal entries, or null when empty. */
export function seasonQuote(
  entries: JournalEntry[],
  seasonStart: string | null,
  today: Date,
): string | null {
  if (entries.length === 0) return null;

  const startKey = seasonStart ?? toDateString(addDays(today, -SEASON_LENGTH + 1));
  const inSeason = entries.filter((entry) => entry.entry_date >= startKey);

  const pool = inSeason.length > 0 ? inSeason : entries;
  const withWords = pool.filter((entry) => (entry.body ?? '').trim().length > 0);
  if (withWords.length === 0) return null;

  // Deterministic pick based on the season start, so the same season always
  // surfaces the same line.
  const index = Math.abs(hashString(startKey)) % withWords.length;
  const entry = withWords[index];
  const body = (entry.body ?? '').trim();
  return body.length > 140 ? body.slice(0, 137).trimEnd() + '…' : body;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return hash;
}

export function formatSeasonRange(start: string | null, today: Date): string {
  const startDate = start ? new Date(start + 'T00:00:00') : addDays(today, -SEASON_LENGTH + 1);
  const endDate = addDays(startDate, SEASON_LENGTH - 1);
  return `${format(startDate, 'd MMM')} – ${format(endDate, 'd MMM yyyy')}`;
}
