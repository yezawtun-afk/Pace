/**
 * Every Supabase call for tasks and categories.
 *
 * Screens never talk to the database directly. Filtering happens in Postgres
 * (not in JavaScript) so a growing history never slows the first paint.
 */

import { toDbTime } from '@/lib/time';
import { supabase } from '@/lib/supabase';
import type { Category, Task, TaskInsert, TaskUpdate } from '@/types/database';

import { startOfTodayIso, todayString, type TaskView } from './grouping';

/**
 * The four views of the Tasks screen.
 *
 *  today    due today or earlier, plus anything finished today (so a task you
 *           just checked off stays visible until tomorrow)
 *  upcoming future due dates only
 *  all      everything still open, including tasks without a date
 *  done     finished tasks, most recently completed first
 */
export async function fetchTasks(view: TaskView): Promise<Task[]> {
  const today = todayString();

  let query = supabase.from('tasks').select('*');

  if (view === 'today') {
    query = query
      .lte('due_date', today)
      .or(`completed.eq.false,completed_at.gte.${startOfTodayIso()}`);
  }

  if (view === 'upcoming') {
    query = query.gt('due_date', today).eq('completed', false);
  }

  if (view === 'all') {
    query = query.eq('completed', false);
  }

  if (view === 'done') {
    query = query.eq('completed', true).order('completed_at', { ascending: false }).limit(100);
  }

  const { data, error } = await query
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('priority', { ascending: true })
    .order('due_time', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export type TaskDraft = {
  title: string;
  notes?: string | null;
  /** "yyyy-MM-dd" or null for "no date". */
  due_date?: string | null;
  /** "HH:MM" or null. */
  due_time?: string | null;
  /** 1 = P1 … 4 = P4. */
  priority?: number;
  category_id?: string | null;
};

/** Trims text and turns empty values into nulls before they reach Postgres. */
function toRow(draft: TaskDraft) {
  return {
    title: draft.title.trim(),
    notes: draft.notes?.trim() ? draft.notes.trim() : null,
    due_date: draft.due_date || null,
    due_time: draft.due_time ? toDbTime(draft.due_time) : null,
    priority: draft.priority ?? 4,
    category_id: draft.category_id || null,
  };
}

export async function createTask(userId: string, draft: TaskDraft): Promise<Task> {
  const row: TaskInsert = { ...toRow(draft), user_id: userId };

  const { data, error } = await supabase.from('tasks').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, draft: TaskDraft): Promise<Task> {
  const patch: TaskUpdate = toRow(draft);

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Checking off is its own call because it also records *when*. Un-checking
 * clears the timestamp, so the Completed view never shows a stale time.
 */
export async function setTaskCompleted(id: string, completed: boolean): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// --- categories -------------------------------------------------------------

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createCategory(userId: string, name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name: name.trim() })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deleting a category never deletes its tasks — the database clears their
 * `category_id` and leaves the task in place (see the schema's foreign key).
 */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
