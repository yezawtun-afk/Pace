-- ===========================================================================
--  Pace — initial database schema
--
--  How to apply: open your Supabase project -> SQL Editor -> New query,
--  paste this entire file and press Run. It runs inside a single transaction,
--  so either everything is created or nothing is.
--
--  What this file does:
--    1. creates the seven tables Pace needs
--    2. creates the indexes used by the queries in the app
--    3. adds row-level security so every user only ever sees their own rows
--    4. keeps updated_at fresh and creates a profile for every new sign-up
--    5. adds delete_own_account(), used by "Delete my account"
--
--  Dates: log_date / entry_date / due_date are `date` (the user's local
--  calendar day). created_at / completed_at are `timestamptz` (real instants).
-- ===========================================================================

begin;

-- Refuse to run twice, instead of failing halfway with confusing errors.
do $$
begin
  if to_regclass('public.profiles') is not null then
    raise exception 'Pace schema already exists. Use a fresh project, or drop the tables first.';
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
--  1. Tables
-- ---------------------------------------------------------------------------

-- One row per auth user. Created automatically by the trigger further down.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  evening_review_time time not null default '20:00',
  theme text not null default 'system',
  onboarding_completed boolean not null default false,
  habit_reminders_enabled boolean not null default true,
  task_reminders_enabled boolean not null default true,
  evening_reminder_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_theme_check check (theme in ('system', 'light', 'dark')),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 80
  )
);

-- A habit the user wants to repeat.
--   frequency_type = 'daily'         -> every day
--   frequency_type = 'weekdays'      -> only the days listed in frequency_days
--   frequency_type = 'weekly_target' -> any n days per week (target_per_week)
-- frequency_days uses 0 = Sunday ... 6 = Saturday (the date-fns convention).
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text,
  color text not null default '#52704F',
  frequency_type text not null default 'daily',
  frequency_days smallint[] not null default '{}',
  target_per_week smallint,
  reminder_time time,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habits_name_length check (char_length(trim(name)) between 1 and 120),
  constraint habits_frequency_type_check check (
    frequency_type in ('daily', 'weekdays', 'weekly_target')
  ),
  constraint habits_frequency_days_check check (
    frequency_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ),
  constraint habits_weekdays_required check (
    frequency_type <> 'weekdays' or cardinality(frequency_days) > 0
  ),
  constraint habits_target_required check (
    frequency_type <> 'weekly_target' or target_per_week is not null
  ),
  constraint habits_target_range check (
    target_per_week is null or target_per_week between 1 and 7
  ),
  -- Lets habit_logs prove that the habit belongs to the same user.
  constraint habits_id_user_key unique (id, user_id)
);

-- One row = "this habit was done on this local date".
-- Un-checking deletes the row, so `completed` is only there for future needs.
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  constraint habit_logs_one_per_day unique (habit_id, log_date),
  constraint habit_logs_habit_owner_fkey
    foreign key (habit_id, user_id)
    references public.habits (id, user_id)
    on delete cascade
);

-- A user-defined grouping for tasks ("Work", "Home", ...).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#2F6FE0',
  created_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(trim(name)) between 1 and 60),
  constraint categories_id_user_key unique (id, user_id)
);

-- Unique per user, ignoring case and surrounding spaces.
create unique index categories_user_name_key
  on public.categories (user_id, lower(btrim(name)));

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid,
  title text not null,
  notes text,
  due_date date,
  due_time time,
  priority smallint not null default 4,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length check (char_length(trim(title)) between 1 and 200),
  constraint tasks_priority_check check (priority between 1 and 4),
  -- Deleting a category keeps the tasks; only the link is removed.
  constraint tasks_category_owner_fkey
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete set null (category_id)
);

-- One journal entry per user per day.
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  title text,
  body text,
  mood smallint,
  prompt_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_entries_one_per_day unique (user_id, entry_date),
  constraint journal_entries_mood_check check (mood is null or mood between 1 and 5),
  constraint journal_entries_id_user_key unique (id, user_id)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint tags_name_length check (char_length(trim(name)) between 1 and 40),
  constraint tags_id_user_key unique (id, user_id)
);

create unique index tags_user_name_key on public.tags (user_id, lower(btrim(name)));

-- Which tags belong to which entry. user_id is duplicated here so the row
-- itself can be guarded by a simple RLS policy.
create table public.journal_entry_tags (
  entry_id uuid not null,
  tag_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (entry_id, tag_id),
  constraint journal_entry_tags_entry_owner_fkey
    foreign key (entry_id, user_id)
    references public.journal_entries (id, user_id)
    on delete cascade,
  constraint journal_entry_tags_tag_owner_fkey
    foreign key (tag_id, user_id)
    references public.tags (id, user_id)
    on delete cascade
);


-- ---------------------------------------------------------------------------
--  2. Indexes for the queries the app actually runs
-- ---------------------------------------------------------------------------

create index habits_user_archived_idx on public.habits (user_id, archived);
create index habit_logs_user_date_idx on public.habit_logs (user_id, log_date);
create index tasks_user_due_idx on public.tasks (user_id, completed, due_date);
create index tasks_category_idx on public.tasks (category_id);
create index journal_entries_user_date_idx
  on public.journal_entries (user_id, entry_date desc);
create index journal_entry_tags_tag_idx on public.journal_entry_tags (tag_id);


-- ---------------------------------------------------------------------------
--  3. updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
--  4. Create a profile for every new auth user
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, timezone)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
    coalesce(
      nullif(btrim(coalesce(new.raw_user_meta_data ->> 'timezone', '')), ''),
      'UTC'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Only the trigger should be able to run this, never a user directly.
revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
--  5. Row-level security: a user can only touch rows they own
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.tags enable row level security;
alter table public.journal_entry_tags enable row level security;

-- The table-level privileges. Row-level security decides *which* rows.
grant select, insert, update, delete on
  public.profiles,
  public.habits,
  public.habit_logs,
  public.categories,
  public.tasks,
  public.journal_entries,
  public.tags,
  public.journal_entry_tags
to authenticated;

-- profiles ---------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- No delete policy on purpose: the profile disappears with the auth user.

-- habits -----------------------------------------------------------------
create policy "habits_select_own" on public.habits
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "habits_insert_own" on public.habits
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "habits_update_own" on public.habits
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "habits_delete_own" on public.habits
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- habit_logs -------------------------------------------------------------
create policy "habit_logs_select_own" on public.habit_logs
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "habit_logs_insert_own" on public.habit_logs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "habit_logs_update_own" on public.habit_logs
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "habit_logs_delete_own" on public.habit_logs
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- categories -------------------------------------------------------------
create policy "categories_select_own" on public.categories
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "categories_insert_own" on public.categories
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "categories_update_own" on public.categories
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "categories_delete_own" on public.categories
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- tasks ------------------------------------------------------------------
create policy "tasks_select_own" on public.tasks
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "tasks_insert_own" on public.tasks
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "tasks_update_own" on public.tasks
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "tasks_delete_own" on public.tasks
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- journal_entries --------------------------------------------------------
create policy "journal_entries_select_own" on public.journal_entries
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "journal_entries_insert_own" on public.journal_entries
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "journal_entries_update_own" on public.journal_entries
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "journal_entries_delete_own" on public.journal_entries
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- tags -------------------------------------------------------------------
create policy "tags_select_own" on public.tags
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "tags_insert_own" on public.tags
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "tags_update_own" on public.tags
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "tags_delete_own" on public.tags
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- journal_entry_tags -----------------------------------------------------
create policy "journal_entry_tags_select_own" on public.journal_entry_tags
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "journal_entry_tags_insert_own" on public.journal_entry_tags
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "journal_entry_tags_update_own" on public.journal_entry_tags
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "journal_entry_tags_delete_own" on public.journal_entry_tags
  for delete to authenticated
  using (user_id = (select auth.uid()));


-- ---------------------------------------------------------------------------
--  6. Account deletion
--
--  Deleting the auth user cascades to profiles and every table above, so one
--  statement removes all of the user's data. SECURITY DEFINER lets it touch
--  auth.users without the app ever holding the service-role key.
-- ---------------------------------------------------------------------------

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'You must be signed in to delete your account.';
  end if;

  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

commit;
