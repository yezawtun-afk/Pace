# Pace

**Find your daily pace.**

Pace is a calm, minimal app that combines a habit tracker, a journal and a to-do list in one
daily flow: check off what is due today, then close the day with a short guided review that
becomes that day's journal entry.

Built for Android, iOS and web from a single Expo + React Native codebase, with data stored in
Supabase so every device sees the same thing. Each account only ever sees its own rows.

> **Status:** all nine phases are complete, plus a second round of design work: a calmer,
> more deliberate visual system (warm paper, one terracotta accent, Lora for the journal), a
> redesigned Today screen, optional proof photos on habit check-offs and tasks, keyboard
> shortcuts on the web, reduced-motion support, haptics, and an accessibility pass. Every row is
> still protected by row-level security and every photo is private to its owner. See
> [Roadmap](#roadmap).

## What it will do

- **Today** — habits due today with streaks, tasks due today plus anything overdue, a progress
  bar, quick add, and a floating **+**.
- **Habits** — daily / chosen weekdays / X times per week, one-tap check-off, back-filling,
  streaks that respect the schedule, 7/30/90-day completion rates, month heatmap, weekly bars.
- **Tasks** — P1–P4 priorities, due dates and times, categories, Today / Upcoming / All /
  Completed views, quick add.
- **Journal** — one entry per day with mood, tags, a daily prompt and autosaved drafts, plus
  month-by-month history, search and a mood chart.
- **Evening review** — a short guided flow: what you completed and missed, mood, prompt, free
  writing, tags, and an offer to move unfinished tasks to tomorrow.
- **Proof photos** — an optional photo on a habit check-off (only if the habit asks for one) or
  on any task, kept in a private bucket and visible only to you.
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
`supabase/migrations/0001_initial_schema.sql`. Proof photos add one more file,
`supabase/migrations/0002_proof_photos.sql` (three columns plus the private `proofs` bucket and
its storage policies).

1. In your Supabase project open **SQL Editor → New query**.
2. Open `supabase/migrations/0001_initial_schema.sql`, select all (`Ctrl+A`), copy (`Ctrl+C`).
3. Paste it into the editor and press **Run**.
4. Repeat with `supabase/migrations/0002_proof_photos.sql`.

You should see **Success. No rows returned** — that is the expected result for a file that only
creates things. Both files are safe to run twice.

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

| Command                           | What it does                              |
| --------------------------------- | ----------------------------------------- |
| `npm start`                       | Start the Expo dev server                 |
| `npm run web` / `android` / `ios` | Start directly on one target              |
| `npm run typecheck`               | TypeScript, no emit                       |
| `npm run lint`                    | ESLint (includes Prettier rules)          |
| `npm run lint:fix`                | Fix lint/format issues automatically      |
| `npm run format`                  | Format the repo with Prettier             |
| `npm test`                        | Jest: pure habit, Today and journal logic |
| `npm run export:web`              | Produce a static web build in `dist/`     |
| `npm run icons`                   | Redraw every app icon and splash mark     |

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
- **Swipe to delete** on a phone: drag a row left and tap Delete. Swiping alone never deletes, and
  the sheet still has the same action.

Tasks live in the `tasks` and `categories` tables. Both are protected by row-level security, so
each account only ever reads and writes its own rows.

## How habits work

Open **Habits** in the nav. Each habit is one card: its icon, name, schedule, current streak, its
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

## How the journal works

**Journal** is the closing half of the daily loop: today's entry at the top, then the history
month by month, a mood chart and a search field. The **Review** pill in the Today and Journal
headers opens the guided version.

### The evening review

Four short steps, one screen, no account of the day is required:

1. **What happened today** — how many habits and tasks got done, and what did not.
2. **Anything left over?** — every open task is pre-selected; one tap pushes them all to tomorrow.
   Anything you unselect keeps its original date.
3. **How did it feel?** — one of five faces, or nothing at all.
4. **Anything worth keeping?** — the day's prompt, a few lines of free writing, and tags.

**Save and finish** writes the entry and takes you back to the journal. Leaving without saving
writes nothing, and re-running the review on a day that already has an entry loads that entry
first, so the flow is also the edit screen.

### Writing without the flow

- **Write freely** opens the same editor for today, and tapping any card in the history opens it
  for that day. The editor holds the mood, the prompt, a title, the body and the tags.
- **Drafts save themselves.** The body is written about a second after you stop typing, and once
  more when the sheet closes, so a lost connection or an accidental tap cannot eat a paragraph.
  "Saved" under the box is the confirmation; "Not saved" means it will retry on the next change.
- **Tags save immediately** because picking one is a single action. Tags are shared across the
  whole journal (`work`, `rest`, `family`), so the same word means the same thing everywhere.
- **Deleting** an entry asks once, and only deletes that day.

### The bits that are easy to get wrong

- **One entry per day.** The table has a unique `(user_id, entry_date)` constraint and the app
  upserts on it, so "save today" can never create two rows.
- **The prompt is not stored on first view.** It is derived from the date
  (`promptForDate` in `src/features/journal/journal.ts`), so the same day offers the same prompt on
  every device, and a prompt you swap with **Another** is simply saved with the entry.
- **Dates are calendar days**, like tasks: the entry belongs to your local day, not to a UTC
  instant.
- **Mood is 1–5** (rough → great) and may be empty. The chart shows the last 30 days as small bars
  — an empty track is a day without a mood, not a bad day.
- **The streak counts days written**, and today being empty does not break it; the day is not over.

Journal data lives in `journal_entries`, `tags` and `journal_entry_tags`, all protected by
row-level security. Grouping, search, the mood trend and the streak are pure functions, so
`npm test` covers them without a database.

## How proof photos work

A photo is always optional, and no prompt ever stands between you and a check-off.

- **Habits.** Turn on **Ask for a photo** in the habit editor. When you check that habit off, a
  small sheet offers **Camera**, **Gallery** or **Skip**; the check-off is saved the moment you tap
  the box, whether or not a photo follows. Habits that do not ask for a photo never show the sheet.
- **Tasks.** The task editor has a **Photo** section with **Add photo**, **Replace photo** and
  **Remove photo**.
- **Where they show up.** A small thumbnail on the Today habit row (tap to open), a dot on the
  habit's month calendar (tap the day to open the photo), and a photo strip in the evening review
  and in that day's journal entry.

How the file is handled:

1. The picker asks for permission only at the moment you tap, with one sentence, and a denial
   leaves a plain explanation plus **Open settings**. On the web it is the browser's own file
   picker.
2. The image is resized so its long side is at most 1080 px (never upscaled) and re-encoded as
   JPEG at quality 0.7 — usually well under 500 KB. Anything still over 2 MB is refused with a
   plain message instead of a silent failure.
3. The resize decodes the photo to pixels and writes a brand-new file, so EXIF, GPS coordinates,
   device model and the original filename never reach the server. `TESTING.md` has the one-minute
   `exiftool` check to prove it on a real photo.
4. The client stores a **storage path** (`{user_id}/{yyyy-mm}/{uuid}.jpg`), never a public URL.
   Screens turn that path into a signed URL that lasts an hour, cached in memory for 55 minutes,
   so a photo is fetched once and never becomes a guessable link.
5. One photo per check-off: adding another replaces it, and the old file is deleted. Removing the
   photo deletes the file too. Deleting the account removes every object under your folder.

The bucket is private. Its policies compare the first path segment with `auth.uid()`, so user A
cannot read, replace or delete user B's photo even with the exact path — see
`supabase/migrations/0002_proof_photos.sql`. Failures never lose the check-off: if an upload
fails you get **Retry upload**, and the compressed file stays on the device until the sheet
closes.

Code: `src/features/proofs/` (`api.ts`, `paths.ts`, `queries.ts`, the thumbnail, viewer and
strip), with the habit sheet in `src/app/(app)/today.tsx` and the task section in
`src/features/tasks/components/task-editor.tsx`.

## How settings, reminders and export work

Open **Settings** in the nav. Everything here is stored on your profile (and the theme choice is
mirrored into local storage so the app paints correctly before the profile loads).

- **Appearance.** System / Light / Dark. The choice is saved to your profile, so signing in on
  another device picks it up, and to local storage so the first paint is right.
- **Reminders.** Three toggles — habits, tasks, evening review — plus an evening review time
  (18:00 … 22:00). On a phone the evening review time schedules a daily local notification
  (permission is asked the first time you enable it). On the web, where notifications cannot
  fire, a banner appears on the Today screen once that time has passed and today is still
  unwritten.
- **Account.** Edit your display name, create an account if you are a guest (keeps all your data),
  sign out, or delete the account. Signing out of a guest warns you first, because a guest exists
  only on that device; deleting asks once and removes everything (profile, tasks, habits, history,
  journal) via a database function — no service key needed.
- **Your data.** **Export everything (JSON)** writes a full backup (profile, tasks, categories,
  habits, habit logs, journal entries, tags and their links). **Export tasks (CSV)** writes the
  task list. On the web the file downloads; on a phone the share sheet opens so you can save it
  to Files, send it to yourself, and so on. Nothing is uploaded.

The reminder scheduling lives in `src/lib/reminders.ts`, the export in `src/features/export/api.ts`
and `src/lib/export-file.ts`, and the profile read/write in `src/features/auth/use-profile.ts`.

## How polish and sync work

- **Accessibility.** Icon-only controls carry labels, tap targets are at least 44 px, and on the
  web the checkbox, chip, mood face and segmented control now expose `aria-checked` /
  `aria-pressed` / `aria-selected`, so a screen reader (or a test) can read their state. The
  existing label-based fallback ("mark … as done" / "as not done") stays, because it works
  everywhere React Native Web does not forward state.
- **Realtime.** `src/lib/realtime.ts` opens one Supabase channel per signed-in user and
  subscribes to changes on `tasks`, `categories`, `habits`, `habit_logs`, `journal_entries`,
  `tags`, `journal_entry_tags` and `profiles`. Any change on another device (or another tab)
  invalidates the matching TanStack Query cache, so the UI re-fetches instead of polling.
  Requires Realtime to be enabled for those tables in the Supabase dashboard; if it is not, the
  app keeps working with manual refresh.
- **Offline queue.** Mutations run with `networkMode: 'offlineFirst'`, so a dropped connection
  pauses them instead of failing, and TanStack Query replays them when the connection returns.
  `refetchOnReconnect` refreshes reads at the same time. `src/hooks/use-is-online.ts` tracks
  connectivity and `src/components/offline-banner.tsx` shows a banner while offline.
- **Motion.** Every animation is under 250 ms (`Motion` in the design tokens): empty states fade
  in, handlers settle, the check box gives a short press-in, the Today progress bar eases to its
  new width. `useReducedMotion` reads the OS/browser setting and skips the fades and the skeleton
  pulse, so nothing moves when you have asked for stillness.
- **Haptics.** `src/lib/haptics.ts` is the only place that talks to the vibration motor: a light
  tick on check-off, a success pulse when the evening review saves. It is a no-op on the web.
- **Keyboard (web).** `n` opens a new task, `q` opens quick entry. Shortcuts are ignored while a
  field has focus and when a modifier key is held, so typing never triggers one.
- **Web details.** Visible focus rings for keyboard users, pointer cursors and hover tints on
  buttons, chips, rows and nav items, and a 40-entry page for the journal history so opening the
  tab stays quick.
- **Contrast.** The terracotta accent was darkened to `#C4472E` so accent text is 4.63:1 on the
  paper background and 4.90:1 behind white button text. Selected chips use ink on the tinted
  surface rather than accent-on-tint, and every semantic colour is checked in both themes.
- **Web layout.** The responsive shell (bottom tabs on phones, sidebar from 900 px, 720 px
  content column) is unchanged; the banners sit above the content in both layouts.

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
    ui/                 primitives: AppText, Card, Screen, Button, TextField, ProgressBar, icons, …
    app-shell.tsx       bottom tabs on phones, sidebar on wide screens
  constants/            design tokens (theme.ts) + starter habits + journal prompts
  features/             per-feature API calls, hooks and components (auth, onboarding, tasks, habits,
                        today, journal, proofs, export)
  hooks/                small reusable hooks (online, wide layout, reduced motion, shortcuts)
  lib/                  Supabase client, query client, preferences, env, date/time helpers, haptics,
                        theme, web helpers
  types/                database types + env typings
supabase/
  migrations/           the SQL you paste into the dashboard SQL Editor (0001 schema, 0002 proofs)
  README.md             database and auth setup, verification queries, troubleshooting
```

## Design notes

- Notion-like calm with Todoist speed: generous whitespace, hairline borders instead of shadows,
  warm paper (`#FBF8F4`) and warm charcoal in dark mode.
- One accent — terracotta — and muted P1–P4 colours. No gradients, no glow, no emoji in the
  chrome, one line-icon set drawn in SVG.
- Habit icons are part of that set: sixteen glyphs drawn from `HabitGlyph`, stored in
  `habits.icon` by key (`leaf`, `walk`, …). Habits created before the switch stored an emoji; the
  app maps it to the matching glyph so nothing looks blank, and saving the habit upgrades it.
- The app icon, adaptive layers, splash marks and favicon are drawn from one vector by
  `npm run icons` (`scripts/generate-icons.mjs`), so the brand colour is defined once.
- Type: Inter/system sans for the interface, Lora for the journal body and large titles. Two
  families at most, on a 12 / 14 / 16 / 20 / 28 scale.
- The whole palette, spacing scale, radii, type sizes and motion durations live in
  `src/constants/theme.ts`. Screens read them through `useTheme()` — never hard-coded hex.
- Layout: single column with bottom tabs on phones; sidebar plus a centred column capped at
  720 px from 900 px width upwards.
- Accessibility: 44 px minimum tap targets, screen-reader labels on icon-only controls, selectable
  state exposed to ARIA on the web, and text contrast kept at or above 4.5:1.

## Roadmap

- [x] **1. Foundation** — Expo + TypeScript + Expo Router, theme, responsive shell, Supabase
      client, env setup, docs
- [x] **2. Database and auth** — migrations with RLS, sign-up/in/out, password reset, profiles,
      onboarding
- [x] **3. Tasks** — CRUD, categories, priorities, due dates, views, quick add
- [x] **4. Habits** — CRUD, check-off, back-fill, streaks with tests, stats and heatmap
- [x] **5. Today** — combined habits + tasks, progress bar, overdue handling
- [x] **6. Journal and evening review** — guided review, prompts, mood, tags, history, search
- [x] **7. Reminders and settings** — notifications, preferences, export, account deletion
- [x] **8. Polish and sync** — realtime, offline queue, animations, accessibility, web layout
- [x] **9. Release prep** — test checklist, EAS Build, web deployment
- [x] **Round 2 · A. Design tokens** — warm paper, terracotta, Lora, one type scale, tab pill
- [x] **Round 2 · B. Today** — progress bar, tidy rows, floating add, empty state, skeletons
- [x] **Round 2 · C. Copy and screens** — taglines removed, the system applied everywhere
- [x] **Round 2 · D. Proof photos** — schema, private bucket, picker, compression, thumbnails
- [x] **Round 2 · E. Polish** — haptics, reduced motion, shortcuts, pagination, contrast pass
- [x] **Round 3 · F. Release pass** — native offline, SVG habit icons, swipe delete, icons and
      splash drawn from code

## Store submission

`PRIVACY.md` is the privacy policy text to publish (fill in the contact address and the effective
date first). Both stores require a public URL for it, plus a support URL — a Google Doc or a
GitHub Pages copy is enough. `TESTING.md` is the release checklist, and `eas.json` already has
`development`, `preview` and `production` profiles.

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
