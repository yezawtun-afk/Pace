/// <reference types="expo/types" />

/**
 * Environment variables are inlined at build time by Expo. Only variables
 * prefixed with EXPO_PUBLIC_ are available in the app bundle, which is exactly
 * what we want: the anon key is designed to be public, and row-level security
 * in Postgres protects the data. The service-role key must never appear here.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_SUPABASE_URL?: string;
    readonly EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  }
}
