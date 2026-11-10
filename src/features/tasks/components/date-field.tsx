import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Chip, ChipRow } from '@/components/ui/chip';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { TextLink } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Layout, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

import { toDateString, todayString } from '../grouping';

type DateFieldProps = {
  /** "yyyy-MM-dd" or null for no date. */
  value: string | null;
  onChange: (value: string | null) => void;
};

/**
 * Due date picker: four one-tap choices for the common cases, and a month
 * calendar behind "Pick another date" for everything else.
 */
export function DateField({ value, onChange }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => (value ? parseISO(value) : new Date()));

  const today = todayString();
  const tomorrow = toDateString(addDays(new Date(), 1));
  const nextWeek = toDateString(addDays(new Date(), 7));

  const isPreset = value === today || value === tomorrow || value === nextWeek;

  return (
    <View style={{ gap: Space.sm }}>
      <ChipRow>
        <Chip
          label="No date"
          selected={value === null}
          onPress={() => {
            onChange(null);
            setOpen(false);
          }}
        />
        <Chip
          label="Today"
          selected={value === today}
          onPress={() => {
            onChange(today);
            setOpen(false);
          }}
        />
        <Chip
          label="Tomorrow"
          selected={value === tomorrow}
          onPress={() => {
            onChange(tomorrow);
            setOpen(false);
          }}
        />
        <Chip
          label="Next week"
          selected={value === nextWeek}
          onPress={() => {
            onChange(nextWeek);
            setOpen(false);
          }}
        />

        {value && !isPreset ? (
          <Chip
            label={format(parseISO(value), 'd MMM')}
            selected
            accessibilityLabel={`Due ${format(parseISO(value), 'd MMMM yyyy')}`}
            onPress={() => setOpen(true)}
          />
        ) : null}
      </ChipRow>

      <TextLink
        label={open ? 'Hide calendar' : 'Pick another date'}
        onPress={() => {
          setOpen((current) => !current);
          if (value) setMonth(parseISO(value));
        }}
      />

      {open ? (
        <Calendar
          month={month}
          value={value}
          onChangeMonth={setMonth}
          onSelect={(day) => {
            onChange(day);
            setOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

/** Monday-first month grid, six weeks tall so its height never jumps. */
function Calendar({
  month,
  value,
  onChangeMonth,
  onSelect,
}: {
  month: Date;
  value: string | null;
  onChangeMonth: (month: Date) => void;
  onSelect: (day: string) => void;
}) {
  const { colors } = useTheme();
  const selected = value ? parseISO(value) : null;

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: addDays(gridStart, 41) });

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: Radius.md,
        padding: Space.sm,
        backgroundColor: colors.surface,
        gap: Space.xs,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MonthButton label="Previous month" onPress={() => onChangeMonth(addMonths(month, -1))}>
          <ChevronLeftIcon size={18} color={colors.textSecondary} />
        </MonthButton>

        <AppText variant="smallStrong" style={{ flex: 1, textAlign: 'center' }}>
          {format(month, 'MMMM yyyy')}
        </AppText>

        <MonthButton label="Next month" onPress={() => onChangeMonth(addMonths(month, 1))}>
          <ChevronRightIcon size={18} color={colors.textSecondary} />
        </MonthButton>
      </View>

      <View
        style={{ flexDirection: 'row' }}
        accessibilityElementsHidden
        importantForAccessibility="no">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, index) => (
          <View key={`${letter}-${index}`} style={{ flex: 1, alignItems: 'center' }}>
            <AppText variant="caption" tone="tertiary">
              {letter}
            </AppText>
          </View>
        ))}
      </View>

      {weeksOf(days).map((week) => (
        <View key={format(week[0], 'yyyy-MM-dd')} style={{ flexDirection: 'row' }}>
          {week.map((day) => {
            const inMonth = isSameMonth(day, month);
            const isSelected = selected ? isSameDay(day, selected) : false;
            const dayString = toDateString(day);

            return (
              <Pressable
                key={dayString}
                onPress={() => onSelect(dayString)}
                accessibilityRole="button"
                accessibilityLabel={format(day, 'EEEE d MMMM yyyy')}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: Layout.minTapTarget - 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: Radius.sm,
                  backgroundColor: isSelected
                    ? colors.accent
                    : pressed
                      ? colors.surfaceMuted
                      : 'transparent',
                  borderWidth: isToday(day) && !isSelected ? 1 : 0,
                  borderColor: colors.accentBorder,
                  opacity: inMonth ? 1 : 0.35,
                })}>
                <AppText
                  variant="small"
                  color={
                    isSelected ? colors.accentText : inMonth ? colors.text : colors.textTertiary
                  }>
                  {format(day, 'd')}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Splits the 42-day grid into six rows of seven. */
function weeksOf(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function MonthButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: Layout.minTapTarget,
        height: Layout.minTapTarget,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}>
      {children}
    </Pressable>
  );
}
