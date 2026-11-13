/**
 * Every Supabase call for habits and their daily logs.
 *
 * `habit_logs` holds one row per habit per completed day. Un-checking deletes
 * that row, so "does a log exist" is the whole question the UI asks.
 */

import { subDays } from 'date-fns';

import { toDateString } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { FrequencyType, Habit, HabitInsert, HabitLog, HabitUpdate } from '@/types/database';

/** How far back the app loads history. Covers the 90-day rate with room left. */
export const HISTORY_DAYS = 180;

function historyStart(): string {
  return toDateString(subDays(new Date(), HISTORY_DAYS));
}

export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Logs from the last `HISTORY_DAYS` days, newest first. */
export async function fetchHabitLogs(): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .gte('log_date', historyStart())
    .order('log_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export type HabitDraft = {
  name: string;
  icon?: string | null;
  color?: string;
  frequency_type: FrequencyType;
  /** 0 = Sunday … 6 = Saturday. Only used by the "chosen days" schedule. */
  frequency_days?: number[];
  target_per_week?: number | null;
  ask_for_proof?: boolean;
  identity?: string | null;
  archived?: boolean;
};

/**
 * Trims text and clears the fields that do not belong to the chosen schedule,
 * so the database check constraints can never reject a valid form.
 */
function toRow(draft: HabitDraft) {
  const weekdays = draft.frequency_type === 'weekdays';
  const weekly = draft.frequency_type === 'weekly_target';

  return {
    name: draft.name.trim(),
    icon: draft.icon ?? null,
    color: draft.color ?? '#52704F',
    frequency_type: draft.frequency_type,
    frequency_days: weekdays ? (draft.frequency_days ?? []) : [],
    target_per_week: weekly ? (draft.target_per_week ?? 3) : null,
    ask_for_proof: draft.ask_for_proof,
    identity: draft.identity ?? null,
    archived: draft.archived,
  };
}

export async function createHabit(userId: string, draft: HabitDraft): Promise<Habit> {
  const row: HabitInsert = { ...toRow(draft), user_id: userId };

  const { data, error } = await supabase.from('habits').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateHabit(id: string, draft: HabitDraft): Promise<Habit> {
  const patch: HabitUpdate = toRow(draft);

  const { data, error } = await supabase
    .from('habits')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/** Deleting a habit also deletes its history (database cascade). */
export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Checks a day off, or clears it again.
 *
 * `log_date` is the user's local calendar day; the day is chosen by the screen
 * (today for the main list, any past day for back-filling).
 */
export async function setHabitDone(
  userId: string,
  habitId: string,
  date: string,
  done: boolean,
): Promise<void> {
  if (done) {
    const { error } = await supabase.from('habit_logs').upsert(
      {
        habit_id: habitId,
        user_id: userId,
        log_date: date,
        completed: true,
      },
      { onConflict: 'habit_id,log_date' },
    );

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('log_date', date);

  if (error) throw error;
}

/** Sets or clears the proof photo path on a habit log row. */
export async function setHabitLogProof(
  habitId: string,
  date: string,
  proofPath: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .update({ proof_path: proofPath })
    .eq('habit_id', habitId)
    .eq('log_date', date);

  if (error) throw error;
}
