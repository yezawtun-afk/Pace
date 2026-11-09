import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/lib/use-theme';

type ProgressRingProps = {
  /** 0 to 1. Values outside the range are clamped. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Content shown in the middle of the ring. */
  children?: ReactNode;
  accessibilityLabel?: string;
};

/**
 * Circular progress indicator built on react-native-svg (works on iOS, Android
 * and web). The background circle is the track, the accent circle is drawn on
 * top and shortened with a dash offset.
 */
export function ProgressRing({
  value,
  size = 84,
  strokeWidth = 6,
  children,
  accessibilityLabel,
}: ProgressRingProps) {
  const { colors } = useTheme();

  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      {children}
    </View>
  );
}
