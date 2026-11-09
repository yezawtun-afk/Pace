import { View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { HabitsIcon } from '@/components/ui/icons';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { useTheme } from '@/lib/use-theme';

/**
 * Habit library: every habit with its streaks and stats.
 * Phase 1 ships the frame and the empty state; phase 4 adds the data.
 */
export default function HabitsScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Practice"
        title="Habits"
        subtitle="Small things, repeated daily. That is the whole trick."
      />

      <View>
        <EmptyState
          icon={<HabitsIcon size={20} color={colors.textTertiary} />}
          title="No habits yet"
          message="Habits you create will live here with their current streak, completion rate and a month heatmap."
        />
      </View>
    </Screen>
  );
}
