# Pace — working notes for future sessions

**Pace** is a calm habit tracker + journal + to-do app: one daily flow from "what do I do
today?" to "how did today go?". Tagline: _Find your daily pace._ Multi-user, every row scoped
to its owner with Postgres row-level security.

## Status

Phase 1 (foundation) is done: Expo + TypeScript + Expo Router, theme system (light/dark/system),
responsive shell (bottom tabs on phones, sidebar on wide screens), Supabase client, env handling,
empty-state screens, README and this file.

Next phases, in order: 2 database + auth → 3 tasks → 4 habits → 5 Today screen → 6 journal +
evening review → 7 reminders/settings/export → 8 polish + realtime + offline queue → 9 release.

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
src/features/       per-feature api.ts / hooks / components (habits, tasks, journal, …)
src/lib/            supabase client, query client, preferences, env, theme hook
src/constants/      design tokens (theme.ts), static content (prompts, starter habits)
src/hooks/          small reusable hooks
src/types/          generated DB types + local env types
supabase/migrations/ SQL migrations (added in phase 2)
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
npm run export:web       # static web build into dist/
```

Always use `npx expo install <pkg>` (not `npm install`) for packages that have native code, so the
SDK-compatible version is picked.

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
