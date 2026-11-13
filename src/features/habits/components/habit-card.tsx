import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

import { isScheduledOn, scheduleLabel, weekDays } from '../schedule';
import {
  daysSinceLastCompletion,
  isDone,
  ratePercent,
  restDayBank,
  rustOpacity,
  todayState,
} from '../stats';
import { toDateString } from '@/lib/dates';
import type { Habit } from '@/types/database';
import { HabitBadge } from './habit-badge';

type HabitCardProps = {
  habit: Habit;
  /** "yyyy-MM-dd" strings of the days this habit was done. */
  done: Set<string>;
  today: Date;
  onToggleToday: () => void;
  onOpen: () => void;
};

/**
 * One habit in the list: badge, name, schedule, streak, and a check button for
 * today. Tapping anywhere else opens the details (stats, heatmap, back-filling).
 */
export function HabitCard({ habit, done, today, onToggleToday, onOpen }: HabitCardProps) {
  const { colors } = useTheme();

  const rate = ratePercent(habit, done, 30, today);
  const rate7 = ratePercent(habit, done, 7, today);
  const state = todayState(habit, done, today);
  const restToday = state === 'rest';

  const days = weekDays(today);
  const rust = rustOpacity(daysSinceLastCompletion(done, today));
  const bank = restDayBank(habit, done, today);

  // One spoken sentence for the whole card, so the dots are decoration only.
  const spoken = [
    habit.name,
    scheduleLabel(habit),
    restToday ? 'rest day today' : state === 'done' ? 'done today' : 'not done today',
    `${rate7}% in the last 7 days`,
    `${rate}% in the last 30 days`,
  ].join(', ');

  return (
    <Card padded={false} style={{ opacity: rust }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: Space.md }}>
        <HabitBadge icon={habit.icon} color={habit.color} />

        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${spoken}. Open details.`}
          style={({ pressed }) => ({
            flex: 1,
            gap: Space.xxs,
            paddingVertical: Space.md,
            paddingHorizontal: Space.md,
            opacity: pressed ? 0.65 : 1,
          })}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {habit.name}
          </AppText>
          {habit.identity ? (
            <AppText
              variant="caption"
              tone="secondary"
              numberOfLines={1}
              style={{ fontStyle: 'italic' }}>
              {habit.identity}
            </AppText>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.xs + 2 }}>
            <AppText variant="caption" tone="tertiary">
              {scheduleLabel(habit)}
            </AppText>
            <AppText variant="caption" tone="tertiary">
              Â·
            </AppText>
            <AppText variant="caption" tone={rate7 >= 70 ? 'accent' : 'tertiary'}>
              {rate7}% / 7d
            </AppText>
            {bank.balance > 0 ? (
              <>
                <AppText variant="caption" tone="tertiary">
                  Â·
                </AppText>
                <AppText variant="caption" tone="tertiary">
                  {bank.balance} rest {bank.balance === 1 ? 'day' : 'days'} banked
                </AppText>
              </>
            ) : null}
          </View>

          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm, marginTop: 2 }}>
            {days.map((day) => {
              const doneThatDay = isDone(done, day);
              const scheduled = isScheduledOn(habit, day);
              const isFuture = day > today;

              return (
                <View
                  key={toDateString(day)}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: doneThatDay
                      ? habit.color
                      : scheduled && !isFuture
                        ? 'transparent'
                        : colors.border,
                    borderWidth: doneThatDay ? 0 : scheduled && !isFuture ? 1 : 0,
                    borderColor: colors.borderStrong,
                    opacity: isFuture ? 0.45 : 1,
                  }}
                />
              );
            })}

            <AppText variant="caption" tone="tertiary" style={{ marginLeft: Space.xs }}>
              {rate}% / 30d
            </AppText>
          </View>
        </Pressable>

        <View style={{ paddingRight: Space.xs }}>
          <Checkbox
            checked={state === 'done'}
            onPress={onToggleToday}
            label={
              state === 'done'
                ? `Mark ${habit.name} as not done today`
                : `Mark ${habit.name} as done today`
            }
          />
        </View>
      </View>

      {restToday ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: Space.md + 2,
            paddingVertical: Space.xs + 2,
          }}>
          <AppText variant="caption" tone="tertiary">
            Rest day â€” {scheduleLabel(habit)}. You can still check it in.
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}
