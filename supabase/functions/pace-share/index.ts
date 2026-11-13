// Supabase Edge Function: pace-share
// Deploy with: supabase functions deploy pace-share
//
// Returns a small JSON summary for a shared pace token. Uses the service role
// key, which is only available inside the function, never in the client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(JSON.stringify({ error: 'missing token' }), { status: 400 });
  }

  const { data: share, error: shareError } = await admin
    .from('pace_shares')
    .select('user_id, revoked_at')
    .eq('token', token)
    .maybeSingle();

  if (shareError || !share || share.revoked_at) {
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
  }

  const userId = share.user_id;
  const today = new Date().toISOString().slice(0, 10);

  // Profile (display name).
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();

  // Habits + today's logs.
  const { data: habits } = await admin.from('habits').select('id, frequency_type, frequency_days, target_per_week, archived').eq('user_id', userId).eq('archived', false);
  const { data: logs } = await admin.from('habit_logs').select('habit_id, log_date').eq('user_id', userId).eq('log_date', today);

  const doneHabitIds = new Set((logs ?? []).map((l: { habit_id: string }) => l.habit_id));
  // A habit counts as "due today" if its schedule includes today. Keep it simple:
  // count all non-archived habits as the denominator; done = those logged today.
  const habitsTotal = (habits ?? []).length;
  const habitsDone = (habits ?? []).filter((h: { id: string }) => doneHabitIds.has(h.id)).length;

  // Tasks due today.
  const { data: tasks } = await admin.from('tasks').select('id, completed, due_date').eq('user_id', userId).eq('due_date', today);
  const tasksTotal = (tasks ?? []).length;
  const tasksDone = (tasks ?? []).filter((t: { completed: boolean }) => t.completed).length;

  const body = {
    date: today,
    displayName: profile?.display_name ?? null,
    habitsDone,
    habitsTotal,
    tasksDone,
    tasksTotal,
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
    },
  });
});
