/**
 * Reads the two public Supabase settings and tells the app whether they look
 * usable. When they are missing we show a setup screen instead of crashing —
 * handy on a fresh clone before `.env` exists.
 */

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const rawAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export const supabaseUrl = rawUrl;
export const supabaseAnonKey = rawAnonKey;

export const isSupabaseConfigured = /^https?:\/\//.test(rawUrl) && rawAnonKey.length > 20;
