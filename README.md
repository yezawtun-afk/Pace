# Pace

**Find your daily pace.**

Pace is a calm, minimal app that combines a habit tracker, a journal and a to-do list in one
daily flow: check off what is due today, then close the day with a short guided review that
becomes that day's journal entry.

Built for Android, iOS and web from a single Expo + React Native codebase, with data stored in
Supabase so every device sees the same thing. Each account only ever sees its own rows.

> **Status:** phase 5 of 9 is complete — the database with row-level security, accounts, onboarding,
> a full task list (priorities, due dates, categories, four views, quick add), a guest mode you can
> try without signing up, habits with streaks, back-filling, completion rates and a month heatmap,
> and a Today screen that pulls the two together behind one progress ring. The journal and the
> evening review arrive next. See [Roadmap](#roadmap).

## What it will do

- **Today** — habits due today with streaks, tasks due today plus anything overdue, a progress
  ring, and quick add.
- **Habits** — daily / chosen weekdays / X times per week, one-tap check-off, back-filling,
  streaks that respect the schedule, 7/30/90-day completion rates, month heatmap, weekly bars.
- **Tasks** — P1–P4 priorities, due dates and times, categories, Today / Upcoming / All /
  Completed views, quick add.
- **Journal** — one entry per day with mood, tags, a daily prompt and autosaved drafts, plus
  calendar browsing, search and a mood chart.
- **Evening review** — a short guided flow: what you completed and missed, mood, prompt, free
  writing, tags, and an offer to move unfinished tasks to tomorrow.
- **Reminders, export, dark mode** — local notifications on mobile (in-app banners on web),
  JSON/CSV export, and a light/dark theme that follows the system or your choice.

## Tech stack

| Layer          | Choice                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| App            | [Expo](https://expo.dev) SDK 58, React Native 0.88, React 19, TypeScript (strict) |
| Navigation     | Expo Router (file-based, routes in `src/app/`)                                    |
| Backend        | [Supabase](https://supabase.com) — auth, Postgres, row-level security             |
| Data layer     | TanStack Query (server state) + Zustand (small local preferences)                 |
| Dates          | date-fns                                                                          |
| Icons & charts | react-native-svg                                                                  |
| Quality        | ESLint + Prettier, Jest for pure logic (from phase 4)                             |

## Requirements

- Node.js 20 or newer (this project was built with Node 24) and npm.
- A free [Supabase](https://supabase.com/dashboard) account — no credit card needed.
- For Android: the **Expo Go** app on your phone, or Android Studio with an emulator.
- For iOS: a Mac with Xcode, or **Expo Go** on an iPhone. (Windows cannot run the iOS simulator;
  cloud builds with EAS are covered in phase 9.)
- Web: any modern browser — nothing extra to install.

## Setup

### 1. Install dependencies

```powershell
cd C:\Users\Lenovo\Desktop\Pace
npm install
```

### 2. Create the Supabase project

1. Open <https://supabase.com/dashboard> and sign in.
2. Click **New project**, pick an organisation, a name (for example `pace`), a strong database
   password (store it somewhere safe) and the region closest to you.
3. Wait a minute or two while the project is provisioned.

### 3. Create the database

Pace needs eight tables, their indexes and their security policies. They all live in one file:
`supabase/migrations/0001_initial_schema.sql`.

1. In your Supabase project open **SQL Editor → New query**.
2. Open `supabase/migrations/0001_initial_schema.sql`, select all (`Ctrl+A`), copy (`Ctrl+C`).
3. Paste it into the editor and press **Run**.

You should see **Success. No rows returned** — that is the expected result for a file that only
creates things. Running it twice is safe: it stops early with `Pace schema already exists`.

Then, while you are in the dashboard, open **Authentication → URL Configuration** and add the
redirect URLs the password-reset emails need:

| Setting           | Value                                      |
| ----------------- | ------------------------------------------ |
| **Site URL**      | `http://localhost:8081`                    |
| **Redirect URLs** | `http://localhost:8081/**` and `pace://**` |

Full details, including the email-confirmation toggle and a verification query, are in
[`supabase/README.md`](supabase/README.md).

Finally, still under **Authentication**, open **Sign In / Providers** and turn on
**Anonymous sign-ins**. That is what the **Continue as guest** button on the sign-in screen uses.

### 4. Add your two public settings

1. In the project, open **Project Settings → API**.
2. Copy **Project URL** and the **anon public** key.
3. Create your env file from the template:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Open `.env` and paste both values:

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

5. **Restart the dev server.** Expo reads `.env` only at startup.

> **Never** put the `service_role` key in `.env`. It bypasses row-level security and would give
> anyone who opens the app full access to the database. The anon key is safe to ship — it is
> designed for that, and every table is protected by RLS.

If the two values are missing or malformed, the app shows a **Connect your database** screen with
these same steps instead of failing with a network error.

### 5. Run the app

```powershell
npm start
```

Then press:

| Key | Opens                                         |
| --- | --------------------------------------------- |
| `w` | the web build in your browser                 |
| `a` | the Android emulator, or a device via Expo Go |
| `i` | the iOS simulator (macOS only)                |

Or go straight to one target:

```powershell
npm run web
npm run android
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS) to run on a physical phone on the
same Wi-Fi network.

## Scripts

| Command                           | What it does                          |
| --------------------------------- | ------------------------------------- |
| `npm start`                       | Start the Expo dev server             |
| `npm run web` / `android` / `ios` | Start directly on one target          |
| `npm run typecheck`               | TypeScript, no emit                   |
| `npm run lint`                    | ESLint (includes Prettier rules)      |
| `npm run lint:fix`                | Fix lint/format issues automatically  |
| `npm run format`                  | Format the repo with Prettier         |
| `npm test`                        | Jest: the pure habit and Today logic  |
| `npm run export:web`              | Produce a static web build in `dist/` |

## How tasks work

Open **Tasks** in the nav. The screen has four views over the same table:

| View         | Shows                                                             |
| ------------ | ----------------------------------------------------------------- |
| **Today**    | Tasks due today or earlier, plus anything you checked off today   |
| **Upcoming** | Future due dates, grouped by day (Tomorrow, Friday, Fri 20 Nov …) |
| **All**      | Every unfinished task, dated or not                               |
| **Done**     | The 100 most recently completed tasks                             |

- **Quick add.** Type in the field above the list and press Enter. New tasks inherit a sensible
  date from the current view: today in Today, tomorrow in Upcoming, no date in All.
- **Details.** Tapping a row opens a sheet with the title, notes, due date (four one-tap presets
  plus a month calendar), time, priority (P1 urgent → P4 no rush) and category.
- **Categories** are yours: create them inside the sheet under **Category → New category**, and
  delete them under **Manage**. Deleting a category never deletes its tasks — they just lose the
  label.
- **Checking off** is optimistic: the box flips immediately and rolls back if the save fails, and
  a finished task stays in Today until the day ends.
- **Sorting** is by date (undated last), then priority, then time — the same order everywhere.

Tasks live in the `tasks` and `categories` tables. Both are protected by row-level security, so
each account only ever reads and writes its own rows.

## How habits work

Open **Habits** in the nav. Each habit is one card: its emoji, name, schedule, current streak, its
last seven days as small dots, its 30-day rate, and a check box for today.

- **Three schedules.** _Every day_, _Chosen days_ (pick weekdays), or _Times per week_ (a target
  from 1× to 7× that any day can satisfy).
- **Checking off** is one tap and optimistic: the box flips immediately and rolls back if the save
  fails. Un-checking deletes that day's row, so "done" is simply "a row exists".
- **Rest days are forgiving.** A day you did not schedule never breaks a streak and is never
  counted as missed. If you check in anyway, it counts.
- **Today is never late.** A scheduled day that is still today can remain unchecked without
  breaking the streak; the streak only resets once a scheduled day has ended unfinished.
- **Streaks follow the schedule.** A weekly-target habit counts consecutive Monday→Sunday weeks
  that reached the target, and the current week can still be finished.
- **Tap a card** for the details: the streak in plain words, completion over the last 7 / 30 / 90
  days, a month heatmap, and the last eight weeks as bars.
- **Back-filling.** In the heatmap, tap any past day to check it in or clear it. Today and future
  days are not tappable in the future, and the arrows move between months.
- **Edit or delete** from the detail sheet. Deleting a habit also deletes its history (a database
  cascade), so it asks once before doing it.

Habits live in `habits` and `habit_logs`, both protected by row-level security. The app loads the
last 180 days of logs in one query and computes streaks, rates and the heatmap on the device, so
the UI reacts instantly without extra requests. Weeks run Monday to Sunday.

The rules above are covered by Jest tests, because date and streak maths is exactly the kind of
thing that breaks quietly:

```powershell
npm test
```

## How Today works

**Today** is the home screen and the reason the two lists exist in one app. It never stores
anything of its own — it is a view over the habits and tasks you already have, so checking
something off here checks it off everywhere.

- **One ring, one number.** The ring counts everything on today's list: habits due today plus
  tasks due today or overdue. It fills as you check things off, and the line beside it splits the
  count into "Habits 1/3 · Tasks 0/2".
- **Habits due today.** A daily habit and a weekly-target habit always appear; a chosen-days habit
  only appears on its days. A rest day you checked in anyway still shows up, marked as a rest-day
  check-in, because a real completion should never look like nothing.
- **Tasks due today.** The same list as the Tasks screen's Today view: everything due today or
  earlier, plus anything you finished today. The "Overdue" group appears only when something has
  slipped, so a quiet day stays quiet.
- **Quick add** at the top of the tasks section drops a task straight onto today.
- **Tap a habit** to open the Habits tab with its full history; **tap a task** to open the same
  editor sheet as everywhere else. The sheet mounts only while open.
- **Nothing is nagging.** An empty day gets a small, calm card instead of a warning, and the
  subtitle changes from "3 things left" to "Everything on your list is done" without celebrating
  too loudly.

The rules for "what belongs on today's list" live in `src/features/today/summary.ts` as pure
functions, so `npm test` covers them alongside the habit maths.

## How guest mode works

**Continue as guest** on the sign-in screen creates an anonymous Supabase account: a real user row
with no email or password. Nothing is stored locally and nothing is faked — a guest is subject to
the same row-level security as everyone else, so every screen behaves exactly as it does for a
signed-in account.

- A guest goes through the same three-step onboarding and lands with starter habits.
- Tasks, habits and journal entries are tied to that account like any other.
- **Settings → Account → Create an account** adds an email and password to the same user id, so
  everything is kept. With **Confirm email** on, Supabase sends a link first.
- Because a guest has no credentials, they can only be signed in on the device that created them.
  Turning on **Anonymous sign-ins** in the dashboard is required — see
  [`supabase/README.md`](supabase/README.md).

## Project structure

```
src/
  app/                  routes (Expo Router) — one file per screen
    (app)/              signed-in area: today, habits, journal, tasks, settings
    (auth)/             signed out area: sign-in, sign-up, forgot-password
    onboarding.tsx      three-step first run: welcome, starter habits, details
    reset-password.tsx  opened from the emailed reset link
    setup-required.tsx  shown when .env has no Supabase credentials
  components/
    ui/                 primitives: AppText, Card, Screen, Button, TextField, icons, …
    app-shell.tsx       bottom tabs on phones, sidebar on wide screens
  constants/            design tokens (theme.ts) + starter habits
  features/             per-feature API calls, hooks and components (auth, onboarding, tasks, habits, today)
  hooks/                small reusable hooks
  lib/                  Supabase client, query client, preferences, env, date/time helpers, theme
  types/                database types + env typings
supabase/
  migrations/           the SQL you paste into the dashboard SQL Editor
  README.md             database and auth setup, verification queries, troubleshooting
```

## Design notes

- Notion-like calm: generous whitespace, hairline borders instead of shadows, one accent colour
  (a soft sage green) and system typography.
- The whole palette lives in `src/constants/theme.ts`. Light and dark define the same keys, and
  screens read colours through `useTheme()` — never hard-coded hex.
- Layout: single column with bottom tabs on phones; sidebar plus a centred column capped at
  720 px from 900 px width upwards.
- Accessibility: 44 px minimum tap targets, screen-reader labels on icon-only controls, and text
  contrast kept at or above 4.5:1.

## Roadmap

- [x] **1. Foundation** — Expo + TypeScript + Expo Router, theme, responsive shell, Supabase
      client, env setup, docs
- [x] **2. Database and auth** — migrations with RLS, sign-up/in/out, password reset, profiles,
      onboarding
- [x] **3. Tasks** — CRUD, categories, priorities, due dates, views, quick add
- [x] **4. Habits** — CRUD, check-off, back-fill, streaks with tests, stats and heatmap
- [x] **5. Today** — combined habits + tasks, progress ring, overdue handling
- [ ] **6. Journal and evening review** — guided review, prompts, mood, tags, history, search
- [ ] **7. Reminders and settings** — notifications, preferences, export, account deletion
- [ ] **8. Polish and sync** — realtime, offline queue, animations, accessibility, web layout
- [ ] **9. Release prep** — test checklist, EAS Build, web deployment

## Troubleshooting

**The setup screen will not go away.** Check that `.env` exists in the project root (not
`src/`), that both names start with `EXPO_PUBLIC_`, and restart `npm start`. Environment
variables are read only at startup.

**"Network request failed" after signing in.** The Supabase project may be paused — free
projects pause after about a week without traffic. Open the dashboard and restore it.

**Expo Go shows an older version of the app.** Shake the device (or press `r` in the terminal) to
reload, and make sure the phone is on the same network as the computer.

**`Pace schema already exists` in the SQL Editor.** The migration has already run on that project.
Nothing is broken — skip it and continue.

**"Could not load your profile" after signing in.** Either the Supabase project is paused, or the
SQL migration was never run so the `profiles` table does not exist. Check the dashboard, then run
the verification query in [`supabase/README.md`](supabase/README.md).

**The password-reset email link opens a blank page.** The redirect URL is not allow-listed. Add
`http://localhost:8081/**` under **Authentication → URL Configuration → Redirect URLs** in
Supabase, and use the newest email (old links expire).

**The confirmation email never arrives.** Free Supabase projects rate-limit emails to a few per
hour, and they often land in spam. Wait a minute, use "Resend the email", or switch
**Authentication → Providers → Email → Confirm email** off while developing.

**Windows: `npm start` keeps printing a QR code but nothing opens.** Press `w` in that terminal
window to open the web build, or `a` to launch an Android emulator.
