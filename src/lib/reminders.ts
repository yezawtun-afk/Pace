import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

/**
 * Local reminders. These only make sense on a phone: on the web we fall back to
 * an in-app banner (see `ReminderBanner`), because browsers cannot schedule a
 * notification for a time the app is closed.
 */

export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/** Cancels every scheduled notification Pace owns. */
export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Best effort: a failed cancel must never block the UI.
  }
}

/**
 * Schedules a daily evening reminder at the given "HH:MM" time, or cancels it
 * when `enabled` is false. Re-scheduling is idempotent: we cancel first.
 */
export async function scheduleEveningReminder(time: string, enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelAllReminders();
  if (!enabled) return;

  const [hourText, minuteText] = time.slice(0, 5).split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  const granted = await requestReminderPermission();
  if (!granted) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'How did today go?',
        body: 'A couple of minutes now keeps the day from blurring into tomorrow.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // Scheduling can fail on simulators without notification support; ignore.
  }
}
