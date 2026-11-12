import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/lib/use-theme';

/**
 * A simple pulsing placeholder block. Use it while data loads instead of a
 * spinner, so the screen keeps its shape. The pulse stops when the person has
 * asked for less motion; the block stays visible at a steady tone.
 */
export function Skeleton({
  width,
  height = 16,
  radius = Radius.sm,
}: {
  width?: number | string;
  height?: number;
  radius?: number;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 0.7 : 0.4);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.7;
      return;
    }

    opacity.value = withRepeat(withTiming(0.9, { duration: 900 }), -1, true);
  }, [opacity, reducedMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceMuted,
        },
        style,
      ]}
    />
  );
}
