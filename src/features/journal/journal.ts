/**
 * Pure helpers for the journal: the daily prompt, the mood scale, grouping,
 * search and the small statistics shown above the entry list.
 *
 * No React and no Supabase here, so `npm test` can pin the rules down directly.
 */

import { eachDayOfInterval, format, parseISO, startOfDay } from 'date-fns';

import { JOURNAL_PROMPTS } from '@/constants/prompts';
import { fromDateString, toDateString } from '@/lib/dates';
import type { JournalEntry, JournalEntryTag, Tag } from '@/types/database';

export type Mood = {
  value: number;
  emoji: string;
  label: string;
};

/** The five moods, roughest to best. Stored as 1–5 in Postgres. */
export const MOODS: Mood[] = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

export function moodLabel(mood: number | null): string | null {
  return MOODS.find((entry) => entry.value === mood)?.label ?? null;
}

export function moodEmoji(mood: number | null): string | null {
  return MOODS.find((entry) => entry.value === mood)?.emoji ?? null;
}

/**
 * The day's prompt. Derived from the date instead of stored on first view, so
 * the same day offers the same prompt everywhere and nobody has to save it to
 * keep it.
 */
export function promptForDate(date: Date, prompts: string[] = JOURNAL_PROMPTS): string {
  const day = Math.floor(fromDateString(toDateString(date)).getTime() / 86_400_000);
  return prompts[((day % prompts.length) + prompts.length) % prompts.length];
}

/** First line or so of the body, for cards. Newlines become spaces. */
export function entryPreview(body: string | null, max = 150): string {
  const flat = (body ?? '').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trimEnd()}…`;
}

export function wordCount(body: string | null): number {
  const flat = (body ?? '').trim();
  if (!flat) return 0;
  return flat.split(/\s+/).length;
}

export type MonthGroup = {
  /** "2026-11" — stable key and easy to compare. */
  key: string;
  title: string;
  entries: JournalEntry[];
};

/** Newest month first, newest entry first inside each month. */
export function groupEntriesByMonth(entries: JournalEntry[]): MonthGroup[] {
  const sorted = [...entries].sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
  const groups: MonthGroup[] = [];

  for (const entry of sorted) {
    const key = entry.entry_date.slice(0, 7);
    let group = groups[groups.length - 1];

    if (!group || group.key !== key) {
      group = {
        key,
        title: format(parseISO(`${key}-01`), 'MMMM yyyy'),
        entries: [],
      };
      groups.push(group);
    }

    group.entries.push(entry);
  }

  return groups;
}

/** Tag names per entry id, so search and cards can look them up in one pass. */
export function tagNamesByEntry(entryTags: JournalEntryTag[], tags: Tag[]): Map<string, string[]> {
  const nameById = new Map(tags.map((tag) => [tag.id, tag.name]));
  const byEntry = new Map<string, string[]>();

  for (const link of entryTags) {
    const name = nameById.get(link.tag_id);
    if (!name) continue;

    const existing = byEntry.get(link.entry_id);
    if (existing) {
      existing.push(name);
    } else {
      byEntry.set(link.entry_id, [name]);
    }
  }

  for (const names of byEntry.values()) {
    names.sort((a, b) => a.localeCompare(b));
  }

  return byEntry;
}

/** Case-insensitive search over title, body and tag names. */
export function searchEntries(
  entries: JournalEntry[],
  entryTags: JournalEntryTag[],
  tags: Tag[],
  query: string,
): JournalEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;

  const namesByEntry = tagNamesByEntry(entryTags, tags);

  return entries.filter((entry) => {
    if ((entry.title ?? '').toLowerCase().includes(needle)) return true;
    if ((entry.body ?? '').toLowerCase().includes(needle)) return true;
    return (namesByEntry.get(entry.id) ?? []).some((name) => name.toLowerCase().includes(needle));
  });
}

export type MoodPoint = {
  /** "yyyy-MM-dd" */
  date: string;
  mood: number | null;
};

/** The last `days` days, oldest first, with the mood recorded for each one. */
export function moodTrend(entries: JournalEntry[], days: number, today: Date): MoodPoint[] {
  const byDate = new Map(entries.map((entry) => [entry.entry_date, entry]));
  const end = startOfDay(today);
  const window = eachDayOfInterval({
    start: new Date(end.getTime() - (days - 1) * 86_400_000),
    end,
  });

  return window.map((day) => {
    const key = toDateString(day);
    return { date: key, mood: byDate.get(key)?.mood ?? null };
  });
}

/** Mean mood over the last `days`, or null when none were recorded. */
export function averageMood(entries: JournalEntry[], days: number, today: Date): number | null {
  const points = moodTrend(entries, days, today).filter((point) => point.mood !== null);
  if (points.length === 0) return null;

  const total = points.reduce((sum, point) => sum + (point.mood ?? 0), 0);
  return total / points.length;
}

/**
 * Consecutive days written, counting back from today. Like habit streaks, today
 * being empty does not break it — the day is not over yet.
 */
export function journalingStreak(entries: JournalEntry[], today: Date): number {
  const written = new Set(entries.map((entry) => entry.entry_date));
  const end = startOfDay(today);
  let streak = 0;

  for (let index = 0; index < 400; index += 1) {
    const day = toDateString(new Date(end.getTime() - index * 86_400_000));

    if (written.has(day)) {
      streak += 1;
      continue;
    }

    if (index === 0) continue;
    break;
  }

  return streak;
}
