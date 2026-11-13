/**
 * Database types for the schema in `supabase/migrations/0001_initial_schema.sql`.
 *
 * These are hand-written to match the SQL exactly. Once the Supabase CLI is
 * linked to the project you can regenerate them instead:
 *
 *   npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.ts
 *
 * (Keep the `Database` export name and shape either way — the app only depends
 * on that.)
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type FrequencyType = 'daily' | 'weekdays' | 'weekly_target';

/** `time` columns come back from PostgREST as "HH:MM:SS". */
export type TimeString = string;
/** `date` columns come back as "YYYY-MM-DD". */
export type DateString = string;

// --- profiles --------------------------------------------------------------
export type Profile = {
  id: string;
  display_name: string | null;
  timezone: string;
  evening_review_time: TimeString;
  theme: ThemePreference;
  onboarding_completed: boolean;
  habit_reminders_enabled: boolean;
  task_reminders_enabled: boolean;
  evening_reminder_enabled: boolean;
  current_season_start: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  display_name?: string | null;
  timezone?: string;
  evening_review_time?: TimeString;
  theme?: ThemePreference;
  onboarding_completed?: boolean;
  habit_reminders_enabled?: boolean;
  task_reminders_enabled?: boolean;
  evening_reminder_enabled?: boolean;
  current_season_start?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Partial<ProfileInsert>;

// --- habits ----------------------------------------------------------------
export type Habit = {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string;
  frequency_type: FrequencyType;
  /** 0 = Sunday … 6 = Saturday (date-fns convention). */
  frequency_days: number[];
  target_per_week: number | null;
  reminder_time: TimeString | null;
  archived: boolean;
  ask_for_proof: boolean;
  identity: string | null;
  created_at: string;
  updated_at: string;
};

export type HabitInsert = {
  id?: string;
  user_id: string;
  name: string;
  icon?: string | null;
  color?: string;
  frequency_type?: FrequencyType;
  frequency_days?: number[];
  target_per_week?: number | null;
  reminder_time?: TimeString | null;
  archived?: boolean;
  ask_for_proof?: boolean;
  identity?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type HabitUpdate = Partial<Omit<HabitInsert, 'user_id'>>;

// --- habit_logs ------------------------------------------------------------
export type HabitLog = {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: DateString;
  completed: boolean;
  proof_path: string | null;
  created_at: string;
};

export type HabitLogInsert = {
  id?: string;
  habit_id: string;
  user_id: string;
  log_date: DateString;
  completed?: boolean;
  proof_path?: string | null;
  created_at?: string;
};

export type HabitLogUpdate = Partial<Omit<HabitLogInsert, 'user_id' | 'habit_id'>>;

// --- categories ------------------------------------------------------------
export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type CategoryInsert = {
  id?: string;
  user_id: string;
  name: string;
  color?: string;
  created_at?: string;
};

export type CategoryUpdate = Partial<Omit<CategoryInsert, 'user_id'>>;

// --- tasks -----------------------------------------------------------------
export type Task = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  notes: string | null;
  due_date: DateString | null;
  due_time: TimeString | null;
  /** 1 = highest (P1) … 4 = lowest (P4). */
  priority: number;
  completed: boolean;
  completed_at: string | null;
  proof_path: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskInsert = {
  id?: string;
  user_id: string;
  category_id?: string | null;
  title: string;
  notes?: string | null;
  due_date?: DateString | null;
  due_time?: TimeString | null;
  priority?: number;
  completed?: boolean;
  completed_at?: string | null;
  proof_path?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TaskUpdate = Partial<Omit<TaskInsert, 'user_id'>>;

// --- journal ---------------------------------------------------------------
export type JournalEntry = {
  id: string;
  user_id: string;
  entry_date: DateString;
  title: string | null;
  body: string | null;
  mood: number | null;
  prompt_text: string | null;
  created_at: string;
  updated_at: string;
};

export type JournalEntryInsert = {
  id?: string;
  user_id: string;
  entry_date: DateString;
  title?: string | null;
  body?: string | null;
  mood?: number | null;
  prompt_text?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type JournalEntryUpdate = Partial<Omit<JournalEntryInsert, 'user_id'>>;

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type TagInsert = {
  id?: string;
  user_id: string;
  name: string;
  created_at?: string;
};

export type TagUpdate = Partial<Omit<TagInsert, 'user_id'>>;

export type JournalEntryTag = {
  entry_id: string;
  tag_id: string;
  user_id: string;
};

export type JournalEntryTagInsert = {
  entry_id: string;
  tag_id: string;
  user_id: string;
};

// --- the `Database` shape supabase-js expects ------------------------------
type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type PaceShare = {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
  revoked_at: string | null;
};

export type PaceShareInsert = {
  id?: string;
  user_id: string;
  token: string;
  created_at?: string;
  revoked_at?: string | null;
};

export type PaceShareUpdate = Partial<PaceShareInsert>;

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<Profile, ProfileInsert, ProfileUpdate>;
      habits: TableDefinition<Habit, HabitInsert, HabitUpdate>;
      habit_logs: TableDefinition<HabitLog, HabitLogInsert, HabitLogUpdate>;
      categories: TableDefinition<Category, CategoryInsert, CategoryUpdate>;
      tasks: TableDefinition<Task, TaskInsert, TaskUpdate>;
      journal_entries: TableDefinition<JournalEntry, JournalEntryInsert, JournalEntryUpdate>;
      tags: TableDefinition<Tag, TagInsert, TagUpdate>;
      journal_entry_tags: TableDefinition<
        JournalEntryTag,
        JournalEntryTagInsert,
        JournalEntryTagInsert
      >;
      pace_shares: TableDefinition<PaceShare, PaceShareInsert, PaceShareUpdate>;
    };
    Views: Record<string, never>;
    Functions: {
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
