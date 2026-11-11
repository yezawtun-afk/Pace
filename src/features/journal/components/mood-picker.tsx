import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

import { MOODS, moodLabel } from '../journal';

type MoodPickerProps = {
  value: number | null;
  /** Tapping the selected face again clears the mood (null). */
  onChange: (mood: number | null) => void;
};

/**
 * Five faces from rough to great. Tapping the same one again clears it, so a
 * mood is never forced — some days you would rather not rate.
 */
export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { colors } = useTheme();
  const label = moodLabel(value);

  return (
    <View style={{ gap: Space.sm }}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="How was today?"
        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Space.sm }}>
        {MOODS.map((mood) => {
          const selected = value === mood.value;

          return (
            <Pressable
              key={mood.value}
              onPress={() => onChange(selected ? null : mood.value)}
              accessibilityRole="radio"
              accessibilityLabel={mood.label}
              accessibilityState={{ selected }}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 56,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: Radius.md,
                borderWidth: 1,
                borderColor: selected ? colors.accentBorder : colors.border,
                backgroundColor: selected ? colors.accentSoft : colors.surface,
                opacity: pressed ? 0.7 : 1,
              })}>
              <AppText
                style={{ fontSize: 22 }}
                accessibilityElementsHidden
                importantForAccessibility="no">
                {mood.emoji}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="caption" tone={label ? 'secondary' : 'tertiary'}>
        {label ? `Today felt ${label.toLowerCase()}.` : 'Optional — tap a face, or leave it blank.'}
      </AppText>
    </View>
  );
}
