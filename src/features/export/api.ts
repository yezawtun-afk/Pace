import { supabase } from '@/lib/supabase';
import type {
  Category,
  Habit,
  HabitLog,
  JournalEntry,
  JournalEntryTag,
  Profile,
  Tag,
  Task,
} from '@/types/database';

export type ExportData = {
  exportedAt: string;
  profile: Profile | null;
  tasks: Task[];
  categories: Category[];
  habits: Habit[];
  habitLogs: HabitLog[];
  journalEntries: JournalEntry[];
  tags: Tag[];
  journalEntryTags: JournalEntryTag[];
};

/** Loads everything the account owns in one pass, for a full backup. */
export async function fetchExportData(userId: string): Promise<ExportData> {
  const [profileRes, tasksRes, categoriesRes, habitsRes, logsRes, entriesRes, tagsRes, linksRes] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('habit_logs').select('*').eq('user_id', userId),
      supabase.from('journal_entries').select('*').eq('user_id', userId),
      supabase.from('tags').select('*').eq('user_id', userId),
      supabase.from('journal_entry_tags').select('*').eq('user_id', userId),
    ]);

  const firstError =
    profileRes.error ||
    tasksRes.error ||
    categoriesRes.error ||
    habitsRes.error ||
    logsRes.error ||
    entriesRes.error ||
    tagsRes.error ||
    linksRes.error;

  if (firstError) throw firstError;

  return {
    exportedAt: new Date().toISOString(),
    profile: profileRes.data ?? null,
    tasks: tasksRes.data ?? [],
    categories: categoriesRes.data ?? [],
    habits: habitsRes.data ?? [],
    habitLogs: logsRes.data ?? [],
    journalEntries: entriesRes.data ?? [],
    tags: tagsRes.data ?? [],
    journalEntryTags: linksRes.data ?? [],
  };
}

/** Turns a list of rows into a CSV string. Handles commas, quotes and newlines. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(','));
  }

  return lines.join('\n');
}
