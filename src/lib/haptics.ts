import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * The app's only haptics layer.
 *
 * Every call is fire-and-forget and failure is silent: haptics are a bonus, and
 * a device without a vibration motor should never see an error. The web has no
 * motor, so it is a no-op there.
 */

/** A light tick when something is checked off or picked. */
export function tapFeedback(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** A short double pulse for a completed action (review saved, day finished). */
export function successFeedback(): void {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
