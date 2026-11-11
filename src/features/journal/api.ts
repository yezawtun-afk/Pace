/**
 * Every Supabase call for the journal.
 *
 * The journal is one row per day (`journal_entries`), plus tags joined through
 * `journal_entry_tags`. Tags are shared across entries, so they live in their
 * own list and the links are loaded separately — that keeps the queries small
 * and lets the app show tag suggestions without a join.
 */

import { supabase } from '@/lib/supabase';
import type { JournalEntry, JournalEntryTag, Tag } from '@/types/database';

/** How much history the journal loads. Plenty for search, cheap enough for a phone. */
export const JOURNAL_LIMIT = 400;

export type EntryDraft = {
  /** "yyyy-MM-dd" — the local calendar day the entry belongs to. */
  entryDate: string;
  title: string | null;
  body: string | null;
  /** 1 = rough … 5 = great, or null when the mood was skipped. */
  mood: number | null;
  promptText: string | null;
};

/** Empty strings become nulls so "no title" is one value, not two. */
function toRow(draft: EntryDraft) {
  const title = draft.title?.trim() ?? '';
  const body = draft.body?.trim() ?? '';

  return {
    entry_date: draft.entryDate,
    title: title || null,
    body: body || null,
    mood: draft.mood,
    prompt_text: draft.promptText?.trim() || null,
  };
}

/** Newest first. */
export async function fetchEntries(): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .limit(JOURNAL_LIMIT);

  if (error) throw error;
  return data ?? [];
}

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchEntryTags(): Promise<JournalEntryTag[]> {
  const { data, error } = await supabase.from('journal_entry_tags').select('*');

  if (error) throw error;
  return data ?? [];
}

/**
 * Creates the day's entry or overwrites it. The table has a unique
 * `(user_id, entry_date)` constraint, so `upsert` is exactly "save today".
 */
export async function saveEntry(userId: string, draft: EntryDraft): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert({ ...toRow(draft), user_id: userId }, { onConflict: 'user_id,entry_date' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('id', id);
  if (error) throw error;
}

/** Replaces an entry's tags with exactly this set, in two round trips. */
export async function setEntryTags(
  userId: string,
  entryId: string,
  tagIds: string[],
): Promise<void> {
  const { error: clearError } = await supabase
    .from('journal_entry_tags')
    .delete()
    .eq('entry_id', entryId);

  if (clearError) throw clearError;
  if (tagIds.length === 0) return;

  const { error } = await supabase
    .from('journal_entry_tags')
    .insert(tagIds.map((tagId) => ({ entry_id: entryId, tag_id: tagId, user_id: userId })));

  if (error) throw error;
}

/**
 * Finds a tag by name, ignoring case and surrounding spaces, or creates it.
 *
 * The database enforces one name per user with a unique index on the lowercased
 * name, so this check keeps the common case ("work" vs "Work") from ending in an
 * error message.
 */
export async function findOrCreateTag(userId: string, rawName: string): Promise<Tag> {
  const name = rawName.trim();
  if (!name) throw new Error('A tag needs a name.');

  const existing = await fetchTags();
  const match = existing.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
  if (match) return match;

  const { data, error } = await supabase
    .from('tags')
    .insert({ user_id: userId, name })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
