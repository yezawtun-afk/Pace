/**
 * The one write onboarding performs: create the chosen starter habits, then mark
 * the profile as onboarded (name, timezone, evening review time).
 *
 * Why two steps in this order? The auth guard only lets the user into the app
 * once `onboarding_completed` is true, so the habits must exist before that flag
 * flips — otherwise the very first Today screen would look empty.
 */

import { updateProfile } from '@/features/auth/api';
import { toDateString } from '@/lib/dates';
import { toDbTime } from '@/lib/time';
import { supabase } from '@/lib/supabase';
import type { HabitInsert, Profile } from '@/types/database';

export type StarterHabitChoice = {
  name: string;
  icon: string;
  color: string;
};

export type CompleteOnboardingInput = {
  userId: string;
  /** Empty string means "no name yet", stored as null. */
  displayName: string;
  timezone: string;
  /** "HH:MM" from the time chips, e.g. "20:00". */
  eveningReviewTime: string;
  habits: StarterHabitChoice[];
};

export async function completeOnboarding({
  userId,
  displayName,
  timezone,
  eveningReviewTime,
  habits,
}: CompleteOnboardingInput): Promise<Profile> {
  const rows: HabitInsert[] = habits.map((habit) => ({
    user_id: userId,
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    // Everything starts as a daily habit; the user can change the schedule on
    // the Habits screen without losing the first day of logging.
    frequency_type: 'daily',
  }));

  let createdHabitIds: string[] = [];

  if (rows.length > 0) {
    const { data, error } = await supabase.from('habits').insert(rows).select('id');
    if (error) throw error;
    createdHabitIds = (data ?? []).map((row) => row.id);
  }

  try {
    return await updateProfile(userId, {
      display_name: displayName.trim() || null,
      timezone,
      evening_review_time: toDbTime(eveningReviewTime),
      onboarding_completed: true,
      // The first 30-day season starts on the day the app is set up.
      current_season_start: toDateString(new Date()),
    });
  } catch (error) {
    // The profile update failed, so the user stays in onboarding. Remove the
    // habits we just inserted, otherwise pressing "Finish" again would create
    // duplicate habits with no obvious way to tell them apart.
    if (createdHabitIds.length > 0) {
      await supabase.from('habits').delete().in('id', createdHabitIds);
    }
    throw error;
  }
}
