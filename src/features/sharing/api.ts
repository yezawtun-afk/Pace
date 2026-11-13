import { supabase } from '@/lib/supabase';

export type SharedPace = {
  date: string;
  displayName: string | null;
  habitsDone: number;
  habitsTotal: number;
  tasksDone: number;
  tasksTotal: number;
};

/**
 * Creates a read-only share token. The row's `token` defaults to a random uuid
 * in Postgres, so the client never has to invent a secret. Returns both the
 * token and the URL a partner can open.
 */
export async function createShareLink(): Promise<{ token: string; url: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Sign in to share your pace.');

  const { data, error } = await supabase
    .from('pace_shares')
    .insert({ user_id: userId })
    .select('token')
    .single();
  if (error) throw error;

  return { token: data.token, url: shareUrl(data.token) };
}

/** The public URL for a token, or '' when no web host is configured. */
export function shareUrl(token: string): string {
  const configured = process.env.EXPO_PUBLIC_SHARE_BASE_URL?.replace(/\/$/, '');
  if (configured) return `${configured}/pace/${token}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/pace/${token}`;
  }
  return '';
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
