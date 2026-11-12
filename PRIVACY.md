# Pace — privacy policy

**Effective date:** _add the date you publish this_
**Contact:** _add a support email address_

Pace is a habit tracker, task list and journal. This page explains what the app stores, where it
goes, and how to remove it.

## What the app stores

Only what you enter, plus what is needed to sign you in:

- **Account:** your email address and a password hash (stored by Supabase Auth). A guest account
  has no email address.
- **Profile:** an optional display name, your timezone, your theme choice, your evening review
  time, and whether reminders are on.
- **Your content:** habits, habit check-offs, tasks, categories, journal entries, moods and tags.
- **Photos** you choose to attach to a habit check-off or a task.

## Where it is stored

Everything is stored in a Supabase project (hosted Postgres and object storage). Traffic is
encrypted in transit with TLS.

Each row belongs to one account and Postgres row-level security enforces that at the database
level: another signed-in user cannot read or change your rows, even with a crafted request.

Photos live in a **private** storage bucket. They are shown through short-lived signed links
generated for your own account, and the storage rules only allow a path that begins with your
own user id. Photo files are re-encoded before upload, which also drops EXIF metadata such as GPS
coordinates.

## What the app does not do

- No advertising, no analytics SDK, no crash-reporting SDK, no tracking pixels.
- No selling or sharing of your data with third parties.
- No background upload of your content. The app talks to Supabase only when you use it.
- Reminders are scheduled **locally on your device** with the operating system's notification
  service. Nothing about them leaves the phone.

## Your choices

- **Export:** Settings → Your data → Export gives you a CSV of your habits, tasks and journal
  entries.
- **Delete:** Settings → Account → Delete account removes your profile, your habits, logs, tasks,
  categories, journal entries, tags and your photo files, then deletes the account itself. This
  cannot be undone.
- **Sign out** clears the session from the device. Cached data is also cleared.

## Children

Pace is not directed at children under 13 and does not knowingly collect data from them.

## Changes

If this policy changes in a way that affects what is stored, the in-app version of this page will
be updated and the effective date above will change.

## Questions

Use the contact address at the top of this page.
