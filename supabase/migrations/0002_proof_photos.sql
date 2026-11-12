-- Phase D: optional proof photos for habit check-offs and tasks.
--
-- Run this in the Supabase SQL Editor after 0001_initial_schema.sql. It is
-- idempotent: re-running it does nothing.

-- 1. Schema changes ---------------------------------------------------------

alter table public.habits
  add column if not exists ask_for_proof boolean not null default false;

alter table public.habit_logs
  add column if not exists proof_path text;

alter table public.tasks
  add column if not exists proof_path text;

-- 2. Storage bucket (private) ---------------------------------------------

insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

-- 3. Storage policies -------------------------------------------------------
-- A user may only touch objects whose first folder equals their own uid.
-- Path format: {user_id}/{yyyy-mm}/{uuid}.jpg

drop policy if exists "proofs_select_own" on storage.objects;
create policy "proofs_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "proofs_insert_own" on storage.objects;
create policy "proofs_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "proofs_update_own" on storage.objects;
create policy "proofs_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "proofs_delete_own" on storage.objects;
create policy "proofs_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
