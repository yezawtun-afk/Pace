import { supabase } from '@/lib/supabase';

function randomToken(): string {
  // 24 url-safe chars, ~144 bits.
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export type SharedPace = {
  date: string;
  displayName: string | null;
  habitsDone: number;
  habitsTotal: number;
  tasksDone: number;
  tasksTotal: number;
};

export async function createShareToken(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Sign in to share your pace.');

  const token = randomToken();

  const { error } = await supabase.from('pace_shares').insert({ user_id: userId, token });
  if (error) throw error;

  return token;
}

export async function revokeShare(token: string): Promise<void> {
  const { error } = await supabase
    .from('pace_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token', token);
  if (error) throw error;
}

export async function fetchSharedPace(token: string, baseUrl: string): Promise<SharedPace> {
  const response = await fetch(
    `${baseUrl}/functions/v1/pace-share?token=${encodeURIComponent(token)}`,
  );
  if (!response.ok) throw new Error('This pace link is no longer available.');
  return (await response.json()) as SharedPace;
}
