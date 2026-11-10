import { format, parseISO } from 'date-fns';
import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

import type { WeekBucket } from '../stats';

type WeekBarsProps = {
  buckets: WeekBucket[];
  /** The habit's colour, used for the filled part of each bar. */
  color: string;
};

/**
 * Eight small bars: one per week, oldest on the left. The height is how much of
 * that week's goal was met, so a partial week still reads honestly.
 */
export function WeekBars({ buckets, color }: WeekBarsProps) {
  const { colors } = useTheme();
  const trackHeight = 56;

  return (
    <View style={{ gap: Space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Space.sm }}>
        {buckets.map((bucket) => {
          const ratio = bucket.expected > 0 ? Math.min(1, bucket.done / bucket.expected) : 0;
          const met = bucket.expected > 0 && bucket.done >= bucket.expected;

          return (
            <View key={bucket.start} style={{ flex: 1, alignItems: 'center', gap: Space.xs }}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={{
                  width: '100%',
                  maxWidth: 34,
                  height: trackHeight,
                  borderRadius: Radius.sm - 2,
                  backgroundColor: colors.surfaceMuted,
                  justifyContent: 'flex-end',
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    height: Math.max(ratio * trackHeight, bucket.done > 0 ? 4 : 0),
                    backgroundColor: met ? color : `${color}99`,
                    opacity: bucket.current ? 1 : 0.85,
                  }}
                />
              </View>

              <AppText variant="caption" tone={bucket.current ? 'secondary' : 'tertiary'}>
                {format(parseISO(bucket.start), 'd MMM')}
              </AppText>
            </View>
          );
        })}
      </View>

      <View
        accessible
        accessibilityLabel={buckets
          .map(
            (bucket) =>
              `week of ${format(parseISO(bucket.start), 'd MMMM')}: ${bucket.done} of ${bucket.expected}`,
          )
          .join('. ')}
        style={{ height: 0 }}
      />
    </View>
  );
}
