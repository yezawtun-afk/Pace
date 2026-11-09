# Pace

**Find your daily pace.**

Pace is a calm, minimal app that combines a habit tracker, a journal and a to-do list in one
daily flow: check off what is due today, then close the day with a short guided review that
becomes that day's journal entry.

Built for Android, iOS and web from a single Expo + React Native codebase, with data stored in
Supabase so every device sees the same thing. Each account only ever sees its own rows.

> **Status:** phase 1 of 9 is complete — app shell, theme system, Supabase wiring and the screen
> frames. Tasks, habits, journal and reminders arrive in the next phases. See
> [Roadmap](#roadmap).

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

### 3. Add your two public settings

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

### 4. Run the app

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
| `npm run export:web`              | Produce a static web build in `dist/` |

## Project structure

```
src/
  app/                  routes (Expo Router) — one file per screen
    (app)/              signed-in area: today, habits, journal, tasks, settings
    setup-required.tsx  shown when .env has no Supabase credentials
  components/
    ui/                 primitives: AppText, Card, Screen, EmptyState, icons, …
    app-shell.tsx       bottom tabs on phones, sidebar on wide screens
  constants/theme.ts    design tokens: colours, spacing, radii, type scale
  features/             per-feature API calls, hooks and components (grows per phase)
  hooks/                small reusable hooks
  lib/                  Supabase client, query client, preferences, env, theme hook
  types/                generated database types + env typings
supabase/migrations/    SQL migrations and RLS policies (phase 2)
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
- [ ] **2. Database and auth** — migrations with RLS, sign-up/in/out, password reset, profiles,
      onboarding
- [ ] **3. Tasks** — CRUD, categories, priorities, due dates, views, quick add
- [ ] **4. Habits** — CRUD, check-off, back-fill, streaks with tests, stats and heatmap
- [ ] **5. Today** — combined habits + tasks, progress ring, overdue handling
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

**Windows: `npm start` keeps printing a QR code but nothing opens.** Press `w` in that terminal
window to open the web build, or `a` to launch an Android emulator.
