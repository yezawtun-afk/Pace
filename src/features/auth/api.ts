/**
 * Every Supabase call for authentication and the profile row.
 *
 * Screens call these functions; they never touch `supabase` directly. That
 * keeps the "what do we send to the server" logic testable and in one place.
 */

import * as Linking from 'expo-linking';

import { detectTimeZone } from '@/lib/time';
import { supabase } from '@/lib/supabase';
import type { Profile, ProfileUpdate } from '@/types/database';

/**
 * Where Supabase sends the user after an email link.
 * Web: an absolute URL on the same site. Native: the `pace://` deep link.
 * Both must be listed in Supabase → Authentication → URL Configuration.
 */
export function authRedirectUrl(path: string): string {
  return Linking.createURL(path);
}

export type SignUpInput = {
  email: string;
  password: string;
  displayName?: string;
};

export async function signUpWithPassword({ email, password, displayName }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      // Picked up by the handle_new_user() trigger to fill in the profile.
      data: {
        display_name: displayName?.trim() || null,
        timezone: detectTimeZone(),
      },
      emailRedirectTo: authRedirectUrl('/today'),
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithPassword({ email, password }: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: authRedirectUrl('/reset-password'),
  });

  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/** Re-sends the sign-up confirmation email. */
export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: { emailRedirectTo: authRedirectUrl('/today') },
  });

  if (error) throw error;
}

/**
 * Reads the signed-in user's profile. The database trigger creates it on
 * sign-up; the fallback insert covers the rare case where that trigger was
 * missing (for example a project set up before the migration ran).
 */
export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: userId, timezone: detectTimeZone() })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return created;
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// --- password recovery links ------------------------------------------------
// On the web, supabase-js notices the tokens in the URL by itself. On a phone
// the link opens the app through a `pace://` deep link, which supabase-js does
// not watch, so the screen hands us the URL and we finish the sign-in here.

/** Reads `key=value` pairs from both the query string and the `#` fragment. */
function readLinkParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const [beforeHash, fragment] = url.split('#');

  const collect = (text: string) => {
    for (const pair of text.split('&')) {
      if (!pair) continue;
      const index = pair.indexOf('=');
      if (index === -1) continue;
      const key = decodeURIComponent(pair.slice(0, index));
      const value = decodeURIComponent(pair.slice(index + 1).replace(/\+/g, ' '));
      params[key] = value;
    }
  };

  const queryStart = beforeHash.indexOf('?');
  if (queryStart >= 0) collect(beforeHash.slice(queryStart + 1));
  if (fragment) collect(fragment);

  return params;
}

/**
 * Turns an emailed recovery link into a signed-in session.
 *
 * Returns true when the link carried usable credentials, false when the URL was
 * unrelated (for example the app opening normally). Throws when the link is
 * invalid or already used, so the screen can explain that.
 */
export async function acceptRecoveryLink(url: string): Promise<boolean> {
  const params = readLinkParams(url);

  if (params.error || params.error_description) {
    throw Object.assign(new Error(params.error_description ?? params.error), {
      code: params.error_code ?? 'link_error',
    });
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return true;
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return true;
  }

  if (params.token_hash && params.type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: 'recovery',
    });
    if (error) throw error;
    return true;
  }

  if (params.type === 'recovery') {
    // A recovery URL with no credentials: it was already used, or it expired.
    throw Object.assign(new Error('This reset link has already been used or has expired.'), {
      code: 'link_used',
    });
  }

  return false;
}

/**
 * Deletes the auth user; the database cascades to every table, so all of the
 * user's data goes with it. Implemented as a SECURITY DEFINER function so the
 * app never needs the service-role key.
 */
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
