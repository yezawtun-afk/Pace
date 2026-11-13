-- Phase F2: identity sentences, seasons, and shared pace tokens.
--
-- Run in the Supabase SQL Editor after 0002_proof_photos.sql. Idempotent.

-- 1. Identity sentence on a habit (BJ Fogg style: "I am someone who ...").
alter table public.habits
  add column if not exists identity text;

-- 2. Season tracking on the profile. A season is a 30-day chapter.
alter table public.profiles
  add column if not exists current_season_start date;

-- Backfill: anyone who already onboarded starts a season today.
update public.profiles
  set current_season_start = current_date
  where onboarding_completed = true
    and current_season_start is null;

-- 3. Shared pace tokens: a read-only link a partner can open.
create table if not exists public.pace_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.pace_shares enable row level security;

drop policy if exists "pace_shares_select_own" on public.pace_shares;
create policy "pace_shares_select_own"
  on public.pace_shares
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "pace_shares_insert_own" on public.pace_shares;
create policy "pace_shares_insert_own"
  on public.pace_shares
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "pace_shares_update_own" on public.pace_shares;
create policy "pace_shares_update_own"
  on public.pace_shares
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists pace_shares_token_idx on public.pace_shares (token);
create index if not exists pace_shares_user_idx on public.pace_shares (user_id);
