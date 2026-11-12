import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CheckIcon } from '@/components/ui/icons';
import { Layout, Motion, Radius } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { pointerCursor, type PressableState } from '@/lib/web';
import { useTheme } from '@/lib/use-theme';

type CheckboxProps = {
  checked: boolean;
  onPress: () => void;
  /** Read out by screen readers, e.g. "Mark Buy milk complete". */
  label: string;
  disabled?: boolean;
};

/**
 * Round-ish check box with a 44×44 tap area. The visual box is 22px; the
 * padding around it is what makes it easy to hit. Checking it gives a short
 * press-in animation, skipped when the device asks for less motion.
 */
export function Checkbox({ checked, onPress, label, disabled = false }: CheckboxProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion || !checked) return;

    scale.value = withSequence(
      withTiming(0.86, { duration: Motion.fast / 2 }),
      withTiming(1, { duration: Motion.fast }),
    );
  }, [checked, reducedMotion, scale]);

  const boxStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      aria-checked={checked}
      hitSlop={4}
      style={({ pressed }: PressableState) => [
        pointerCursor,
        {
          width: Layout.minTapTarget,
          height: Layout.minTapTarget,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
      ]}>
      <Animated.View style={boxStyle}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: Radius.sm - 2,
            borderWidth: checked ? 0 : 1.5,
            borderColor: colors.borderStrong,
            backgroundColor: checked ? colors.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {checked ? <CheckIcon size={13} color={colors.accentText} strokeWidth={2.4} /> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}
