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
