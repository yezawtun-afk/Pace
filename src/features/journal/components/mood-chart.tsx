import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

import type { MoodPoint } from '../journal';

type MoodChartProps = {
  points: MoodPoint[];
  /** Mean of the recorded days, or null when there are none. */
  average: number | null;
};

/**
 * A small bar for every day in the window: taller is a better mood, an empty
 * track is a day with no mood recorded. No axes — the shape is the point.
 */
export function MoodChart({ points, average }: MoodChartProps) {
  const { colors } = useTheme();
  const height = 68;
  const rated = points.filter((point) => point.mood !== null).length;

  return (
    <View style={{ gap: Space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height }}>
        {points.map((point) => {
          const ratio = point.mood ? point.mood / 5 : 0;

          return (
            <View
              key={point.date}
              style={{
                flex: 1,
                height: '100%',
                borderRadius: 3,
                backgroundColor: colors.surfaceMuted,
                justifyContent: 'flex-end',
                overflow: 'hidden',
              }}>
              {point.mood ? (
                <View
                  style={{
                    height: Math.max(ratio * height, 4),
                    backgroundColor: colors.accent,
                    opacity: 0.55 + ratio * 0.45,
                  }}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Space.md }}>
        <AppText variant="caption" tone="tertiary">
          {rated} of {points.length} days rated
        </AppText>
        <AppText variant="caption" tone="secondary">
          {average === null ? 'No moods yet' : `Average ${average.toFixed(1)} / 5`}
        </AppText>
      </View>

      <View
        accessible
        accessibilityLabel={
          average === null
            ? 'Mood chart: no moods recorded yet.'
            : `Mood chart over the last ${points.length} days: ${rated} days rated, average ${average.toFixed(1)} out of 5.`
        }
        style={{ height: 0 }}
      />
    </View>
  );
}
