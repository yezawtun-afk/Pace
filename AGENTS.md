# Pace — working notes for future sessions

**Pace** is a calm habit tracker + journal + to-do app: one daily flow from "what do I do
today?" to "how did today go?". Tagline: _Find your daily pace._ Multi-user, every row scoped
to its owner with Postgres row-level security.

## Status

Phase 1 (foundation) is done: Expo + TypeScript + Expo Router, theme system (light/dark/system),
responsive shell (bottom tabs on phones, sidebar on wide screens), Supabase client, env handling,
empty-state screens, README and this file.

Phase 2 (database + auth) is done: `supabase/migrations/0001_initial_schema.sql` (8 tables, 31 RLS
policies, indexes, updated_at triggers, `handle_new_user()` profile trigger,
`delete_own_account()`), hand-written `src/types/database.ts`, auth provider with query-cache
clearing, sign-up / sign-in / sign-out / password reset, three-step onboarding, route guards via
`Stack.Protected`. Docs live in `supabase/README.md`.

Next phases, in order: 8 polish + realtime + offline queue → 9 release.

Phase 3 (tasks) is done: `src/features/tasks/` (`keys.ts`, `grouping.ts` pure logic, `api.ts`,
`queries.ts`), `TaskRow`, `DateField` (presets + month calendar), `QuickAdd`, `TaskEditor` sheet,
new primitives `Chip`/`ChipRow`/`Dot`, `Checkbox`, `Sheet`, `ErrorState`; the tasks screen has
Today / Upcoming / All / Done views. Categories are created and deleted inside the editor.
Server-side filtering in `fetchTasks(view)`; sorting and grouping stay in `grouping.ts` so they
can be unit-tested.

Phase 4 (habits) is done: `src/features/habits/` (`schedule.ts` and `stats.ts` pure, `keys.ts`,
`api.ts`, `queries.ts`, four components + the editor and detail sheets), `src/lib/dates.ts` shared
day helpers (tasks now import from there), `src/constants/habits.ts`, and a `FlameIcon`. One log row
per habit per day (`habit_logs`, unique `habit_id, log_date`); un-checking deletes it. The list
loads the last `HISTORY_DAYS = 180` of logs once and computes streaks/rates/heatmap on the device.
Streak rules live in `currentStreak()`: rest days are skipped, today unfinished never breaks a
streak, a rest day that _was_ checked in counts, and weekly targets count Monday→Sunday weeks with
the current week left open. Months are always six Monday-first rows (`monthWeeks`). Jest arrived
with this phase: `jest.config.js` (`jest-expo` preset + `@/` mapper), `tsconfig` has
`"types": ["jest"]`, tests in `src/features/habits/__tests__/`, and `npm test` runs 35 checks over
the schedule and stats rules.

Phase 5 (Today) is done: `src/features/today/` (`summary.ts` pure, one component,
`__tests__/summary.test.ts`) and a rewritten `src/app/(app)/today.tsx`. Today is a read-only view
over the existing tables — no new schema. `habitsForToday()` keeps scheduled habits plus any
rest-day check-in, `todayProgress()` folds both lists into the ring's numbers, and `greetingName()`
drops "Guest" so the header never reads like a form letter. The screen uses `useProfile`,
`useHabits`, `useHabitLogs`, `useTasks('today')`, `useCategories`, `useToggleHabitDay` and
`useSetTaskCompleted`; `TaskEditor` mounts only while a row is open. Sections fail and retry
independently, and an empty day gets a small `QuietNote` card rather than a big empty state.
`npm test` is now 48 checks.

Phase 6 (journal + evening review) is done: `src/features/journal/` (`journal.ts` pure + 19 tests,
`keys.ts`, `api.ts`, `queries.ts`, components `mood-picker`, `mood-chart`, `tag-picker`,
`entry-card`, `entry-editor`), `src/constants/prompts.ts` (16 prompts), a rewritten
`src/app/(app)/journal/index.tsx` and `src/app/(app)/journal/review.tsx` (registered in
`(app)/_layout.tsx`). One row per day: `saveEntry()` upserts on the table's
`unique (user_id, entry_date)` constraint, so the editor and the review can both write "today"
without creating duplicates. The prompt is derived from the date (`promptForDate`) instead of
being stored on first view, so every device shows the same prompt. Tags are shared per user and
linked through `journal_entry_tags`, loaded as one flat list and mapped with
`tagNamesByEntry()`. The editor autosaves 900 ms after typing stops and flushes on close; tags
save immediately (an entry row is created first if needed). The review is four steps (recap →
move unfinished to tomorrow → mood → write/tags) and reuses `habitsForToday()` from
`features/today/summary.ts`; `rescheduleTasks()` / `useRescheduleTasks()` in the tasks feature
move the selected tasks to tomorrow. Entry points: the **Review** pill in the Today and Journal
headers, plus **Evening review** / **Write freely** on the journal screen. Search matches title,
body and tag names client-side over the last 400 entries. `npm test` is now 67 checks.

Small supporting edits made in phase 6: `TextField` takes an optional `minHeight` (the body box is
taller than the default), `SearchIcon` was added to `icons.tsx`, and the `Modal`-based `Sheet`
leaves a hidden duplicate input in the DOM on web — target inputs with a non-zero width when
automating the browser.

Phase 7 (settings, reminders, export) is done: a rewritten `src/app/(app)/settings/index.tsx`
(Appearance, Reminders, Account, Your data, About sections), `src/components/reminder-banner.tsx`,
`src/lib/reminders.ts` (permission + daily scheduling via expo-notifications, web no-op),
`src/features/export/api.ts` (`fetchExportData`, `toCsv`) and `src/lib/export-file.ts`
(download on web, share sheet on mobile), plus `useUpdateProfile()` and `useThemeSync()` in
`src/features/auth/use-profile.ts` and `src/lib/use-theme-sync.ts`. Profile fields already
existed in the schema (`evening_review_time`, `theme`, `*_reminders_enabled`); this phase wires
them up. The evening review time is stored as `time` (returns "HH:MM:SS"), so the UI slices to
5 chars before comparing. Reminder toggles and time changes call `updateProfile` and re-schedule
the notification. Sign-out warns guests first; delete account calls the `delete_own_account()`
RPC. `npm test` still 67 (no new pure logic this phase).

Guest mode (anonymous sign-in) sits on top of phase 2: `signInAsGuest()` in
`src/features/auth/api.ts`, `isGuest` on `useAuth()`, the **Continue as guest** button on the
sign-in screen, and an Account card in Settings whose sheet calls `upgradeGuestAccount()` —
`updateUser()` on the current user, so the guest keeps their rows, plus a follow-up write to
`profiles.display_name` (the sign-up trigger only runs once). Needs **Anonymous sign-ins**
enabled in the dashboard; if it is off the error message says so. `signOut()` still has no UI, so a
guest cannot lock themselves out yet — phase 7 (account settings) must add a warning there.

Accessibility gap found while testing web: React Native Web 0.21 does not turn
`accessibilityState={{ checked }}` into `aria-checked`, so the checkbox state is only carried by
the changing label ("mark … as done" / "as not done"). Add the `aria-*` props next to
`accessibilityState` in `Checkbox`, `Chip` and `SegmentedControl` during phase 8.

### Auth architecture (phase 2)

- `src/app/_layout.tsx` holds the only guards. `Stack.Protected` groups: `(auth)` when signed out,
  `onboarding` while `profiles.onboarding_completed` is false, `(app)` after it is true.
  `reset-password` and `setup-required` sit outside the guards on purpose.
- Every Supabase call for auth/profile lives in `src/features/auth/api.ts`; onboarding inserts in
  `src/features/onboarding/api.ts` (habits first, then the profile flag, with a habit rollback if
  the profile update fails).
- `useProfile()` is the single source for the profile row; onboarding writes the returned row into
  the query cache with `setQueryData` so the guard flips without a refetch.
- Recovery links: on web supabase-js reads the URL itself; on native `acceptRecoveryLink(url)`
  turns the `pace://` deep link into a session (`setSession` / `exchangeCodeForSession` /
  `verifyOtp`).
- The theme is still local (Zustand). `profiles.theme` exists and is reserved for phase 7 sync.

## Stack (do not swap without asking)

| Concern        | Choice                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| App            | Expo SDK 58, React Native 0.88, React 19.3, TypeScript strict          |
| Navigation     | Expo Router, routes in `src/app/`, typed routes on                     |
| Backend        | Supabase: auth, Postgres, row-level security (`@supabase/supabase-js`) |
| Server state   | TanStack Query (single client in `src/lib/query-client.ts`)            |
| Local UI state | Zustand + AsyncStorage (`src/lib/preferences.ts`)                      |
| Dates          | date-fns; `date` columns are the user's local calendar day             |
| Graphics       | react-native-svg (icons, progress ring, later charts)                  |
| Quality        | ESLint (expo flat config) + Prettier, `tsc --noEmit`                   |

## Folder map

```
src/app/            routes only, one file per screen, _layout.tsx per navigator
src/components/     shared UI (ui/ holds primitives: text, card, screen, icons, …)
src/components/app-shell.tsx   navigation chrome + NAV_ITEMS (single source of truth)
src/features/       per-feature api.ts / keys.ts / hooks / components (auth, onboarding, …)
src/lib/            supabase client, query client, preferences, env, dates/time helpers, theme
src/constants/      design tokens (theme.ts), static content (prompts, starter habits)
src/hooks/          small reusable hooks
src/types/          database.ts (must match the SQL) + local env types
supabase/           migrations/0001_initial_schema.sql + README with dashboard steps
```

## Conventions

- **Screens stay thin.** They compose components and call feature hooks. No Supabase calls in a
  screen; every query/mutation lives in `src/features/<area>/api.ts` with its key in `keys.ts`.
- **One design system.** Colours, spacing, radii and type sizes come from
  `src/constants/theme.ts` through `useTheme()`. No hard-coded hex values in screens. Text uses
  `<AppText variant tone>`, surfaces use `<Card>`, pages use `<Screen>` + `<ScreenHeader>`.
- **Navigation.** Add a destination to `NAV_ITEMS` in `src/components/app-shell.tsx`; the bottom
  tab bar and the sidebar both render from it. Use `router.navigate` for top-level switches and
  `router.push` for detail screens so Android back behaves.
- **Dates.** `date` columns store the local calendar day, `timestamptz` stores real instants.
  "Today" is always computed with the device timezone. Tests for this logic live next to the pure
  functions so they can run in Jest without React.
- **Accessibility.** 44×44 minimum tap targets, `accessibilityLabel` on icon-only controls,
  `accessibilityState` for selection, and never colour alone to carry meaning.
- **Secrets.** Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` reach the app.
  The service-role key is never used client-side; account deletion will use a `SECURITY DEFINER`
  SQL function instead.

## Commands

```bash
npm install              # first time
npm start                # dev server (press w / a for web / Android)
npm run web              # web only
npm run android          # Android emulator or Expo Go
npm run typecheck        # tsc --noEmit
npm run lint             # expo lint (ESLint + Prettier rules)
npm run lint:fix         # auto-fix what can be fixed
npm run format           # prettier --write .
npm test                 # jest (pure habit, Today and journal logic)
npm run export:web       # static web build into dist/
```

Always use `npx expo install <pkg>` (not `npm install`) for packages that have native code, so the
SDK-compatible version is picked.

## Git

**Every phase ends with a commit _and_ a push.** The user asked for this explicitly, so do not
stop at `git commit`:

```powershell
git add -A
git commit -m "Phase N: <short summary>"
git push origin master
git status -sb   # must show "## master...origin/master" with no ahead/behind markers
```

One commit per phase, pushed to `origin` (`https://github.com/yezawtun-afk/Pace.git`). PowerShell
prints git's progress on stderr and shows it as an error even when the push worked — confirm with
`git log origin/master --oneline -1` instead of trusting the red text. Never force-push or rewrite
history: previous phases are already public.

## Environment

`.env` (gitignored, created from `.env.example`) needs both values from the Supabase dashboard.
Expo inlines `EXPO_PUBLIC_*` at build time, so restart the dev server after editing `.env`.
When they are missing the app shows `/setup-required` instead of crashing.

---

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
