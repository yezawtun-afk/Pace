import { Pressable, View } from 'react-native';

import { CheckIcon } from '@/components/ui/icons';
import { Layout, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type CheckboxProps = {
  checked: boolean;
  onPress: () => void;
  /** Read out by screen readers, e.g. "Mark Buy milk complete". */
  label: string;
  disabled?: boolean;
};

/**
 * Round-ish check box with a 44×44 tap area. Used for tasks today and habits in
 * phase 4. The visual box is 22px; the padding around it is what makes it easy
 * to hit.
 */
export function Checkbox({ checked, onPress, label, disabled = false }: CheckboxProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      hitSlop={4}
      style={({ pressed }) => ({
        width: Layout.minTapTarget,
        height: Layout.minTapTarget,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}>
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
    </Pressable>
  );
}
