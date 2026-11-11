import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useJournalEntries } from '@/features/journal/queries';
import { useProfile } from '@/features/auth/use-profile';
import { todayString } from '@/lib/dates';
import { useTheme } from '@/lib/use-theme';

/**
 * A calm in-app banner shown on the web (and anywhere notifications cannot
 * fire) once the evening review time has passed and today is still unwritten.
 */
export function ReminderBanner({ onOpen }: { onOpen: () => void }) {
  const { colors } = useTheme();
  const profileQuery = useProfile();
  const entriesQuery = useJournalEntries();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const profile = profileQuery.data;
    let desired = false;

    if (profile?.evening_reminder_enabled) {
      const today = todayString();
      const writtenToday = (entriesQuery.data ?? []).some((entry) => entry.entry_date === today);

      if (!writtenToday) {
        const [hourText, minuteText] = profile.evening_review_time.slice(0, 5).split(':');
        const target = new Date();
        target.setHours(Number(hourText), Number(minuteText), 0, 0);
        desired = new Date() >= target;
      }
    }

    const timer = setTimeout(() => setVisible(desired), 0);
    const interval = setInterval(() => {
      if (!profile?.evening_reminder_enabled) return;
      const [hourText, minuteText] = (profile.evening_review_time ?? '20:00')
        .slice(0, 5)
        .split(':');
      const target = new Date();
      target.setHours(Number(hourText), Number(minuteText), 0, 0);
      setVisible(new Date() >= target);
    }, 60_000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [profileQuery.data, entriesQuery.data]);

  if (!visible) return null;

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel="Start the evening review"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space.sm,
        paddingVertical: Space.md,
        paddingHorizontal: Space.lg,
        borderRadius: Radius.md,
        backgroundColor: colors.surfaceMuted,
        opacity: pressed ? 0.7 : 1,
      })}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="smallStrong">Evening review</AppText>
        <AppText variant="caption" tone="secondary">
          The day is winding down — a few lines now keeps it from blurring.
        </AppText>
      </View>
      <AppText variant="smallStrong" color={colors.accent}>
        Open
      </AppText>
    </Pressable>
  );
}
