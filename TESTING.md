# Pace — release test checklist

Run through this before every release. Mark each item done on the target platform.

## Build and type safety
- [ ] `npm install`
- [ ] `npm run typecheck` (tsc --noEmit) passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes (67 checks)
- [ ] `npx expo-doctor` reports no issues
- [ ] `npm run export:web` succeeds and `dist/` loads in a browser

## First run (new account)
- [ ] App opens to the sign-in screen with the Pace icon and splash
- [ ] Sign up with email + password works; confirmation email arrives (or confirm-email is off in dev)
- [ ] Three-step onboarding completes: welcome → starter habits → details
- [ ] Starter habits appear on Habits and Today
- [ ] Sign in with the new account works after sign out
- [ ] Password reset email opens the reset screen and updates the password

## Guest mode
- [ ] "Continue as guest" creates an account and runs onboarding
- [ ] Guest can create tasks, habits and journal entries
- [ ] Settings → Account → "Create an account" upgrades the guest and keeps all data
- [ ] Signing out of a guest shows the warning dialog
- [ ] Deleting an account removes all data and returns to sign-in

## Today
- [ ] Progress ring counts habits + tasks due today or overdue
- [ ] Habits due today show with streaks; rest-day check-ins appear marked
- [ ] Overdue tasks appear in their own group
- [ ] Quick add creates a task on today
- [ ] Tapping a habit opens its detail; tapping a task opens the editor
- [ ] Empty day shows the quiet card, not a warning
- [ ] Review pill opens the evening review

## Habits
- [ ] Create / edit / delete a habit (daily, chosen days, weekly target)
- [ ] Check off today and un-check (row deleted)
- [ ] Back-fill a past day in the heatmap
- [ ] Streak, 7/30/90-day rates and weekly bars look right
- [ ] Rest days never break a streak; today unfinished never breaks it

## Tasks
- [ ] Quick add in each view inherits the right date
- [ ] Today / Upcoming / All / Done views filter correctly
- [ ] Editor: title, notes, due date presets + calendar, time, priority, category
- [ ] Create / rename / delete a category; deleting keeps tasks
- [ ] Checking off is optimistic and rolls back on failure
- [ ] Sorting: date, then priority, then time

## Journal
- [ ] Evening review: all four steps, move unfinished tasks to tomorrow
- [ ] Write freely saves with autosave ("Saved" appears)
- [ ] Mood picker, prompt with "Another", title, body, tags
- [ ] Tags are shared and selectable across entries
- [ ] History grouped by month; search matches title, body and tags
- [ ] Mood chart and streak update after a new entry
- [ ] Delete an entry asks once

## Settings
- [ ] Theme switch repaints the app and syncs to the account
- [ ] Reminder toggles and evening review time persist
- [ ] Display name saves
- [ ] Export JSON and CSV produce files
- [ ] Sign out and delete account work

## Sync and offline
- [ ] Two tabs: a change in one appears in the other (Realtime enabled)
- [ ] Airplane mode: check-off queues and replays on reconnect
- [ ] Offline banner appears while offline

## Accessibility
- [ ] Screen readers announce checkbox, chip and segmented-control state
- [ ] All tap targets are at least 44 px
- [ ] Contrast is at least 4.5:1 in light and dark

## Platforms
- [ ] Web (Chrome, Safari, Firefox)
- [ ] Android (Expo Go and a dev build)
- [ ] iOS (Expo Go; EAS build if available)

## Store assets (phase 9)
- [ ] App icon (1024×1024) and adaptive icon render correctly
- [ ] Splash screen matches the theme
- [ ] Screenshots captured for store listings
- [ ] Privacy policy and support URL ready
