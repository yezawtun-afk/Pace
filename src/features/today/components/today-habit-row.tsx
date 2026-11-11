import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { FlameIcon } from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

import { HabitBadge } from '@/features/habits/components/habit-badge';
import { currentStreak, streakLabel } from '@/features/habits/stats';
import type { TodayHabit } from '../summary';

type TodayHabitRowProps = {
  entry: TodayHabit;
  /** Days this habit was done, as "yyyy-MM-dd" keys. */
  done: Set<string>;
  today: Date;
  onToggle: () => void;
  onOpen: () => void;
  /** Removes the divider under the last row of a card. */
  last?: boolean;
};

/**
 * One habit on Today: a small badge, the name, the streak, and the check box.
 * Tapping the name opens the habit in the Habits tab for the full history.
 */
export function TodayHabitRow({
  entry,
  done,
  today,
  onToggle,
  onOpen,
  last = false,
}: TodayHabitRowProps) {
  const { colors } = useTheme();
  const { habit, done: isDoneToday, restDay } = entry;

  const streak = currentStreak(habit, done, today);
  const streakText = streakLabel(streak, habit);
  const state = isDoneToday ? 'done' : restDay ? 'rest day check-in' : 'not done today';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: Space.md,
        paddingRight: Space.xs,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${state}, ${streakText}. Open in Habits.`}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.md,
          paddingVertical: Space.sm + 2,
          paddingRight: Space.sm,
          opacity: pressed ? 0.65 : 1,
        })}>
        <HabitBadge icon={habit.icon} color={habit.color} size={34} />

        <View style={{ flex: 1, gap: 2 }}>
          <AppText
            variant="bodyStrong"
            tone={isDoneToday ? 'secondary' : 'default'}
            numberOfLines={2}>
            {habit.name}
          </AppText>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.xs + 1 }}>
            {streak > 0 ? <FlameIcon size={12} color={colors.accent} /> : null}
            <AppText variant="caption" tone={streak > 0 ? 'accent' : 'tertiary'}>
              {streakText}
            </AppText>
            {restDay ? (
              <AppText variant="caption" tone="tertiary">
                · Rest day check-in
              </AppText>
            ) : null}
          </View>
        </View>
      </Pressable>

      <Checkbox
        checked={isDoneToday}
        onPress={onToggle}
        label={
          isDoneToday ? `Mark ${habit.name} as not done today` : `Mark ${habit.name} as done today`
        }
      />
    </View>
  );
}
