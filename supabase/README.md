# Supabase setup

Everything the database needs lives in one file:

```
supabase/migrations/0001_initial_schema.sql
```

It creates the tables, indexes, row-level security policies, the trigger that makes a profile for
every new user, and the `delete_own_account()` function. No CLI and no Docker are required — you
paste the file into the Supabase dashboard once.

## 1. Paste the migration

1. Open your project at <https://supabase.com/dashboard>.
2. In the left sidebar click **SQL Editor**, then **New query**.
3. Open `supabase/migrations/0001_initial_schema.sql` in VS Code, select everything
   (`Ctrl+A`), copy it (`Ctrl+C`).
4. Paste into the editor and press **Run** (or `Ctrl+Enter`).
5. You should see **Success. No rows returned**.

The whole file runs inside one transaction, so a half-created database is not possible. If you
run it a second time it stops immediately with
`Pace schema already exists` instead of failing halfway — that message just means the schema is
already in place.

## 2. Check it worked

Paste this into a new SQL Editor query. It should print one row with `tables = 8` and
`policies = 31`.

```sql
select
  (select count(*) from pg_tables where schemaname = 'public') as tables,
  (select count(*) from pg_policies where schemaname = 'public') as policies;
```

To see the table list:

```sql
select tablename from pg_tables where schemaname = 'public' order by tablename;
```

Expected: `categories`, `habit_logs`, `habits`, `journal_entries`, `journal_entry_tags`,
`profiles`, `tags`, `tasks`.

## 3. Auth settings

Open **Authentication** in the sidebar.

### URL configuration

**Authentication → URL Configuration**

| Setting           | Value                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| **Site URL**      | `http://localhost:8081` (change this to your real web URL before launch) |
| **Redirect URLs** | `http://localhost:8081/**` and `pace://**`                               |

Why both? Emails sent from a browser should come back to the web app, and emails opened on a
phone should open the app itself. Add your production URL (for example
`https://pace.example.com/**`) when you deploy in phase 9.

> The `pace://` scheme is set in `app.json` (`expo.scheme`). Expo Go uses a different scheme
> (`exp://…`), which is why the phone link only works fully in a development build. On a phone
> with Expo Go you can still copy the link and open it manually.

### Email confirmation

**Authentication → Providers → Email**

- **Confirm email — off** is the friendliest while you are building: signing up puts you straight
  into onboarding, and you never wait for an email.
- **Confirm email — on** is what a real app should ship with. Signing up then shows a "check your
  inbox" screen, and the account works only after the link is clicked.

Either works with the app; it reads the session Supabase hands back and sends the user to
onboarding or to the sign-in screen with an explanation.

### Password rules

**Authentication → Providers → Email → Password requirements** — the app enforces 8 characters
minimum in the form. Raising the server-side minimum is a good idea before launch; the form shows
Supabase's own message if a password is rejected.

## 4. What the schema guarantees

- **Every table has row-level security on.** A signed-in user can only select, insert, update and
  delete rows where `user_id = auth.uid()`. The `profiles` table uses `id = auth.uid()`.
- **Cross-user links are impossible.** `habit_logs` points at `(habit_id, user_id)`, and
  `tasks` at `(category_id, user_id)`, so a row cannot reference someone else's habit or category
  even if the client sends a wrong id.
- **A profile exists from the first second.** An `after insert` trigger on `auth.users` creates it,
  taking the name and time zone from the sign-up metadata.
- **Deleting a category keeps its tasks.** Only `category_id` becomes `null`.
- **Deleting an account removes everything.** `delete_own_account()` deletes the caller's
  `auth.users` row; `on delete cascade` from there clears every table. It is `SECURITY DEFINER`,
  so the app never needs the service-role key.
- **`updated_at` stays honest.** A trigger refreshes it on `profiles`, `habits`, `tasks` and
  `journal_entries`.

## 5. Regenerating the TypeScript types (optional)

`src/types/database.ts` is hand-written to match the SQL. Once you have the Supabase CLI you can
replace it with generated output:

```powershell
npx supabase gen types typescript --project-id <your-project-ref> --schema public > src/types/database.ts
```

Keep the exported name `Database` and the same table names; the app imports nothing else from that
file that the generator does not produce.

## 6. If something goes wrong

**`Pace schema already exists`** — the migration has already run on this project. Nothing to do.
To start over, drop the eight tables (or create a fresh project) and run it again.

**`permission denied for table ...` in the app** — the table is missing its `grant` or its policy.
Re-read the error: PostgREST returns `42501` for both. The migration grants
`select, insert, update, delete` to `authenticated` and adds a policy per table; if you edited the
file, re-run those two sections.

**"Could not load your profile" inside the app** — usually a paused project or a bad `.env`.
Check the URL and anon key, and confirm the project is not paused in the dashboard.
