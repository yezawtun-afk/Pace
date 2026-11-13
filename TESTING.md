# Pace — release test checklist

Run through this before every release. Mark each item done on the target platform.

## Build and type safety
- [ ] `npm install`
- [ ] `npm run typecheck` (tsc --noEmit) passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes (117 checks)
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
- [ ] Progress bar counts habits + tasks due today or overdue
- [ ] Habits due today show with streaks; rest-day check-ins appear marked
- [ ] Overdue tasks appear in their own group
- [ ] Quick add creates a task on today
- [ ] Tapping a habit opens its detail; tapping a task opens the editor
- [ ] Empty day shows the quiet card, not a warning
- [ ] Review pill opens the evening review

## Habits
- [ ] Create / edit / delete a habit (daily, chosen days, weekly target)
- [ ] The icon picker shows all sixteen line glyphs and the choice survives a reload
- [ ] A habit created before the icon switch still shows a glyph (legacy emoji mapping)
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
- [ ] Swipe a task row left on a phone: Delete panel appears, tapping it removes the task
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

## Proof photos

Apply `supabase/migrations/0002_proof_photos.sql` first. Run these on Android **and** web.

- [ ] Habit without "Ask for a photo": checking it off shows no sheet
- [ ] Habit with the toggle on: checking off opens the sheet; **Skip** keeps the check-off
- [ ] Camera and Gallery both work (Gallery/file picker only on web)
- [ ] Thumbnail appears on the Today row and opens the viewer; pinch/double-tap zoom works
- [ ] Habit calendar shows a dot on that day; tapping the day opens the photo
- [ ] Replace from the viewer swaps the photo and the old file is gone from Storage
- [ ] Remove from the viewer clears the row and deletes the file
- [ ] Task editor: Add / Replace / Remove photo, and an image icon on the task row
- [ ] Photo strip appears in the evening review and in that day's journal entry
- [ ] A 12 MP photo ends up around or under 500 KB and still looks sharp
- [ ] A file over 2 MB after compression is refused with a plain message
- [ ] Airplane mode during upload: check-off is saved, **Retry upload** succeeds on reconnect
- [ ] Permission denied shows one sentence plus **Open settings** (native), picker message on web
- [ ] User A cannot open user B's path, even pasted directly into `createSignedUrl`
- [ ] Deleting the account removes every object under the user's folder

**EXIF check (one minute, native):** take a photo with location on, attach it as proof, download
the object from Supabase Storage, then run `exiftool photo.jpg`. Expect no `GPS`, `Make`, `Model`
or `DateTimeOriginal` tags — only the JPEG basics the encoder wrote. This is by construction (the
manipulator decodes to pixels and writes a new file), and this check is the proof.

## Keyboard and motion (web)

- [ ] `n` opens a new task, `q` opens quick entry, and neither fires while typing in a field
- [ ] Focus rings are visible when tabbing; buttons and rows show a hover tint and pointer cursor
- [ ] With "reduce motion" on, empty states appear instantly and skeletons stop pulsing
- [ ] Journal history loads 40 entries and "Show older entries" adds more

## Sync and offline
- [ ] Two tabs: a change in one appears in the other (Realtime enabled)
- [ ] Airplane mode: check-off queues and replays on reconnect
- [ ] Offline banner appears while offline (on a phone, not just the web)

## Accessibility
- [ ] Screen readers announce checkbox, chip and segmented-control state
- [ ] All tap targets are at least 44 px
- [ ] Contrast is at least 4.5:1 in light and dark (accent text and buttons included)
- [ ] Dynamic type up to 200% does not clip labels in the nav or Today rows
- [ ] Check-off and review save give a light haptic on a real device

## Platforms
- [ ] Web (Chrome, Safari, Firefox)
- [ ] Android (Expo Go and a dev build)
- [ ] iOS (Expo Go; EAS build if available)

## Store assets (phase 9)
- [ ] `npm run icons` regenerates the same files (no visual diff)
- [ ] App icon (1024×1024) and adaptive icon render correctly
- [ ] Splash screen matches the theme in light and dark
- [ ] Screenshots captured for store listings
- [ ] Privacy policy and support URL ready
