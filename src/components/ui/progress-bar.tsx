import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Motion, Radius } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/lib/use-theme';

/**
 * The slim progress bar used on Today. The fill eases to its new width in under
 * a quarter of a second; with reduced motion it simply snaps.
 *
 * `Easing` comes from Reanimated on purpose: `withTiming` only accepts a
 * worklet, so a plain JS easing function would throw at runtime.
 */
export function ProgressBar({ ratio, height = 6 }: { ratio: number; height?: number }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const value = useSharedValue(ratio);

  useEffect(() => {
    value.value = reducedMotion
      ? ratio
      : withTiming(ratio, { duration: Motion.slow, easing: Easing.out(Easing.cubic) });
  }, [ratio, reducedMotion, value]);

  const fill = useAnimatedStyle(() => ({ width: `${Math.round(value.value * 100)}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      style={{
        height,
        borderRadius: Radius.pill,
        backgroundColor: colors.surfaceMuted,
        overflow: 'hidden',
      }}>
      <Animated.View
        style={[
          { height: '100%', borderRadius: Radius.pill, backgroundColor: colors.accent },
          fill,
        ]}
      />
    </View>
  );
}
