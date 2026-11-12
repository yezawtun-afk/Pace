import { addMonths, format, isSameMonth, isToday as isTodayDate } from 'date-fns';
import { Pressable, View } from 'react-native';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { Layout, Radius, Space } from '@/constants/theme';
import { toDateString } from '@/lib/dates';
import { useTheme } from '@/lib/use-theme';
import type { Habit } from '@/types/database';

import { isScheduledOn, monthLabel, monthWeeks } from '../schedule';

type MonthHeatmapProps = {
  habit: Habit;
  /** Any date inside the month being shown. */
  month: Date;
  done: Set<string>;
  /** "yyyy-MM-dd" → storage path, for days with a proof photo. */
  proofs?: Map<string, string>;
  today: Date;
  onChangeMonth: (month: Date) => void;
  onToggleDay: (date: string) => void;
  onOpenProof?: (date: string) => void;
};

/**
 * A month at a glance, Monday first.
 *
 * Filled = done, outlined = a scheduled day that was missed, faint = a rest day
 * or a day still in the future. Any past day can be tapped, which is how
 * back-filling works. A small dot marks days with a proof photo; tapping one
 * opens the photo instead of toggling the day.
 */
export function MonthHeatmap({
  habit,
  month,
  done,
  proofs,
  today,
  onChangeMonth,
  onToggleDay,
  onOpenProof,
}: MonthHeatmapProps) {
  const { colors } = useTheme();
  const weeks = monthWeeks(month);
  const nextMonth = addMonths(month, 1);
  const canGoForward = nextMonth <= today;

  return (
    <View style={{ gap: Space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MonthButton label="Previous month" onPress={() => onChangeMonth(addMonths(month, -1))}>
          <ChevronLeftIcon size={18} color={colors.textSecondary} />
        </MonthButton>

        <AppText variant="smallStrong" style={{ flex: 1, textAlign: 'center' }}>
          {monthLabel(month)}
        </AppText>

        <MonthButton
          label="Next month"
          disabled={!canGoForward}
          onPress={() => onChangeMonth(nextMonth)}>
          <ChevronRightIcon
            size={18}
            color={canGoForward ? colors.textSecondary : colors.borderStrong}
          />
        </MonthButton>
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{ flexDirection: 'row' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, index) => (
          <View key={`${letter}-${index}`} style={{ flex: 1, alignItems: 'center' }}>
            <AppText variant="caption" tone="tertiary">
              {letter}
            </AppText>
          </View>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={toDateString(week[0])} style={{ flexDirection: 'row' }}>
          {week.map((day) => {
            const key = toDateString(day);
            const inMonth = isSameMonth(day, month);
            const isFuture = day > today;
            const dayDone = done.has(key);
            const scheduled = isScheduledOn(habit, day);
            const proof = proofs?.get(key);

            const background = dayDone
              ? habit.color
              : inMonth
                ? scheduled
                  ? colors.surface
                  : colors.surfaceMuted
                : 'transparent';
            const borderColor =
              isTodayDate(day) && !dayDone
                ? colors.accentBorder
                : scheduled && inMonth && !isFuture
                  ? colors.border
                  : 'transparent';

            return (
              <Pressable
                key={key}
                onPress={() => (proof && onOpenProof ? onOpenProof(key) : onToggleDay(key))}
                disabled={isFuture}
                accessibilityRole="button"
                accessibilityLabel={`${format(day, 'EEEE d MMMM')}, ${
                  dayDone
                    ? 'done'
                    : isFuture
                      ? 'in the future'
                      : scheduled
                        ? 'not done'
                        : 'rest day'
                }${proof ? ', has a photo' : ''}`}
                accessibilityState={{ selected: dayDone, disabled: isFuture }}
                style={({ pressed }) => ({
                  flex: 1,
                  padding: 2,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <View
                  style={{
                    height: Layout.minTapTarget - 6,
                    borderRadius: Radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: inMonth ? background : 'transparent',
                    borderWidth: 1,
                    borderColor,
                  }}>
                  <AppText
                    variant="caption"
                    color={
                      dayDone
                        ? '#FFFFFF'
                        : inMonth && !isFuture
                          ? colors.textSecondary
                          : colors.textTertiary
                    }
                    style={{ opacity: inMonth ? 1 : 0.35 }}>
                    {format(day, 'd')}
                  </AppText>

                  {proof ? (
                    <View
                      style={{
                        position: 'absolute',
                        right: 3,
                        bottom: 3,
                        width: 5,
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor: dayDone ? '#FFFFFF' : colors.accent,
                      }}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md, marginTop: Space.xxs }}>
        <Legend color={habit.color} label="Done" filled />
        <Legend color={colors.border} label="Missed" />
        <Legend color={colors.borderStrong} label="Rest day" filled muted />
      </View>
    </View>
  );
}

function Legend({
  color,
  label,
  filled = false,
  muted = false,
}: {
  color: string;
  label: string;
  filled?: boolean;
  muted?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.xs }}>
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: 3,
          backgroundColor: filled ? color : 'transparent',
          borderWidth: filled && !muted ? 0 : 1,
          borderColor: muted ? colors.borderStrong : color,
        }}
      />
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
    </View>
  );
}

function MonthButton({
  label,
  onPress,
  disabled = false,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        width: Layout.minTapTarget,
        height: Layout.minTapTarget,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}>
      {children}
    </Pressable>
  );
}
