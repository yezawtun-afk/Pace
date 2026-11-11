import type { JournalEntry, JournalEntryTag, Tag } from '@/types/database';

import {
  MOODS,
  averageMood,
  entryPreview,
  groupEntriesByMonth,
  journalingStreak,
  moodLabel,
  moodTrend,
  promptForDate,
  searchEntries,
  tagNamesByEntry,
  wordCount,
} from '../journal';

/** 10 November 2026 is a Tuesday. */
const TODAY = new Date(2026, 10, 10);

function makeEntry(overrides: Partial<JournalEntry>): JournalEntry {
  return {
    id: 'entry-1',
    user_id: 'user-1',
    entry_date: '2026-11-10',
    title: null,
    body: null,
    mood: null,
    prompt_text: null,
    created_at: '2026-11-10T20:00:00.000Z',
    updated_at: '2026-11-10T20:00:00.000Z',
    ...overrides,
  };
}

const tags: Tag[] = [
  { id: 'tag-work', user_id: 'user-1', name: 'work', created_at: '2026-11-01T00:00:00.000Z' },
  { id: 'tag-rest', user_id: 'user-1', name: 'rest', created_at: '2026-11-01T00:00:00.000Z' },
];

function link(entryId: string, tagId: string): JournalEntryTag {
  return { entry_id: entryId, tag_id: tagId, user_id: 'user-1' };
}

describe('promptForDate', () => {
  it('returns the same prompt for the same day', () => {
    expect(promptForDate(TODAY)).toBe(promptForDate(new Date(2026, 10, 10, 23, 59)));
  });

  it('stays inside the list and rotates', () => {
    const prompts = ['a', 'b', 'c'];

    expect(promptForDate(TODAY, prompts)).toMatch(/^[abc]$/);
    expect(promptForDate(new Date(2026, 10, 11), prompts)).not.toBe(promptForDate(TODAY, prompts));
  });
});

describe('moods', () => {
  it('maps 1–5 to labels and emoji', () => {
    expect(MOODS.map((mood) => mood.label)).toEqual(['Rough', 'Low', 'Okay', 'Good', 'Great']);
    expect(moodLabel(4)).toBe('Good');
  });

  it('returns null when no mood was recorded', () => {
    expect(moodLabel(null)).toBeNull();
    expect(moodLabel(9)).toBeNull();
  });
});

describe('entryPreview and wordCount', () => {
  it('flattens newlines and trims', () => {
    expect(entryPreview('  one\n\ntwo  ')).toBe('one two');
  });

  it('cuts long bodies with an ellipsis', () => {
    const preview = entryPreview('word '.repeat(60), 20);
    expect(preview.endsWith('…')).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(21);
  });

  it('handles an empty body', () => {
    expect(entryPreview(null)).toBe('');
    expect(wordCount(null)).toBe(0);
    expect(wordCount('  two   words ')).toBe(2);
  });
});

describe('groupEntriesByMonth', () => {
  it('orders months and entries newest first', () => {
    const groups = groupEntriesByMonth([
      makeEntry({ id: 'oct', entry_date: '2026-10-31' }),
      makeEntry({ id: 'nov-a', entry_date: '2026-11-02' }),
      makeEntry({ id: 'nov-b', entry_date: '2026-11-09' }),
    ]);

    expect(groups.map((group) => group.title)).toEqual(['November 2026', 'October 2026']);
    expect(groups[0].entries.map((entry) => entry.id)).toEqual(['nov-b', 'nov-a']);
  });

  it('returns nothing for no entries', () => {
    expect(groupEntriesByMonth([])).toEqual([]);
  });
});

describe('tagNamesByEntry', () => {
  it('sorts names and ignores unknown tags', () => {
    const map = tagNamesByEntry(
      [link('entry-1', 'tag-work'), link('entry-1', 'tag-rest'), link('entry-1', 'gone')],
      tags,
    );

    expect(map.get('entry-1')).toEqual(['rest', 'work']);
  });
});

describe('searchEntries', () => {
  const entries = [
    makeEntry({ id: 'body', body: 'A long walk by the river' }),
    makeEntry({ id: 'title', entry_date: '2026-11-09', title: 'Slow morning' }),
    makeEntry({ id: 'tag', entry_date: '2026-11-08', body: 'Nothing much' }),
  ];
  const links = [link('tag', 'tag-work')];

  it('returns everything for an empty query', () => {
    expect(searchEntries(entries, links, tags, '   ')).toHaveLength(3);
  });

  it('matches body, title and tag names regardless of case', () => {
    expect(searchEntries(entries, links, tags, 'RIVER').map((entry) => entry.id)).toEqual(['body']);
    expect(searchEntries(entries, links, tags, 'slow').map((entry) => entry.id)).toEqual(['title']);
    expect(searchEntries(entries, links, tags, 'work').map((entry) => entry.id)).toEqual(['tag']);
  });
});

describe('moodTrend and averageMood', () => {
  const entries = [
    makeEntry({ id: 'a', entry_date: '2026-11-10', mood: 5 }),
    makeEntry({ id: 'b', entry_date: '2026-11-08', mood: 2 }),
    makeEntry({ id: 'c', entry_date: '2026-11-01', mood: 1 }),
  ];

  it('returns one point per day, oldest first, with nulls for gaps', () => {
    const points = moodTrend(entries, 3, TODAY);

    expect(points).toHaveLength(3);
    expect(points.map((point) => point.date)).toEqual(['2026-11-08', '2026-11-09', '2026-11-10']);
    expect(points.map((point) => point.mood)).toEqual([2, null, 5]);
  });

  it('averages only the days that were recorded', () => {
    expect(averageMood(entries, 3, TODAY)).toBeCloseTo(3.5);
  });

  it('has no average when nothing was recorded', () => {
    expect(averageMood([], 7, TODAY)).toBeNull();
  });
});

describe('journalingStreak', () => {
  it('counts consecutive days including today', () => {
    const entries = [
      makeEntry({ entry_date: '2026-11-10' }),
      makeEntry({ entry_date: '2026-11-09' }),
      makeEntry({ entry_date: '2026-11-08' }),
    ];

    expect(journalingStreak(entries, TODAY)).toBe(3);
  });

  it('does not break when today is not written yet', () => {
    const entries = [
      makeEntry({ entry_date: '2026-11-09' }),
      makeEntry({ entry_date: '2026-11-08' }),
    ];

    expect(journalingStreak(entries, TODAY)).toBe(2);
  });

  it('stops at the first missing day', () => {
    const entries = [
      makeEntry({ entry_date: '2026-11-10' }),
      makeEntry({ entry_date: '2026-11-08' }),
    ];

    expect(journalingStreak(entries, TODAY)).toBe(1);
  });

  it('is zero with no entries', () => {
    expect(journalingStreak([], TODAY)).toBe(0);
  });
});
