// Supabase Edge Function: pace-share
// Deploy with: supabase functions deploy pace-share
//
// Returns a small JSON summary for a shared pace token. Uses the service role
// key, which is only available inside the function, never in the client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'authorization, apikey, content-type',
};

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(JSON.stringify({ error: 'missing token' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { data: share, error: shareError } = await admin
    .from('pace_shares')
    .select('user_id, revoked_at')
    .eq('token', token)
    .maybeSingle();

  if (shareError || !share || share.revoked_at) {
    return new Response(JSON.stringify({ error: 'not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  const userId = share.user_id;

  // Profile (display name + timezone, so "today" matches the owner's day).
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name, timezone')
    .eq('id', userId)
    .maybeSingle();

  const timezone = profile?.timezone ?? 'UTC';
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();

  const { data: habits } = await admin
    .from('habits')
    .select('id, frequency_type, frequency_days')
    .eq('user_id', userId)
    .eq('archived', false);

  const { data: logs } = await admin
    .from('habit_logs')
    .select('habit_id')
    .eq('user_id', userId)
    .eq('log_date', today);

  const doneHabitIds = new Set((logs ?? []).map((log: { habit_id: string }) => log.habit_id));

  // A habit counts for today when its schedule says so: daily always, chosen
  // days only on those days, weekly targets whatever day it is.
  const due = (habits ?? []).filter(
    (habit: { frequency_type: string; frequency_days: number[] | null }) =>
      habit.frequency_type === 'daily' ||
      habit.frequency_type === 'weekly_target' ||
      (habit.frequency_type === 'weekdays' && (habit.frequency_days ?? []).includes(weekday)),
  );

  const habitsTotal = due.length;
  const habitsDone = due.filter((habit: { id: string }) => doneHabitIds.has(habit.id)).length;

  // Tasks due today.
  const { data: tasks } = await admin
    .from('tasks')
    .select('completed, due_date')
    .eq('user_id', userId)
    .eq('due_date', today);

  const tasksTotal = (tasks ?? []).length;
  const tasksDone = (tasks ?? []).filter((task: { completed: boolean }) => task.completed).length;

  const body = {
    date: today,
    displayName: profile?.display_name ?? null,
    habitsDone,
    habitsTotal,
    tasksDone,
    tasksTotal,
  };

  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});
