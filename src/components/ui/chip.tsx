import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Layout, Radius, Space } from '@/constants/theme';
import { pointerCursor, type PressableState } from '@/lib/web';
import { useTheme } from '@/lib/use-theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** Small dot or icon drawn before the label. */
  leading?: ReactNode;
  accessibilityLabel?: string;
};

/**
 * One option in a row of choices (due date, time, priority, category).
 * Full 44px height so it is comfortable to hit on a phone, and `selected` is
 * reported to screen readers rather than relying on colour alone.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  disabled = false,
  leading,
  accessibilityLabel,
}: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      aria-pressed={selected}
      style={({ pressed, hovered }: PressableState) => [
        pointerCursor,
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.sm - 2,
          minHeight: Layout.minTapTarget,
          paddingHorizontal: Space.md + 2,
          borderRadius: Radius.pill,
          borderWidth: 1,
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected
            ? colors.accentSoft
            : hovered && !disabled
              ? colors.surfaceMuted
              : colors.surface,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}>
      {leading}
      <AppText variant="small" color={selected ? colors.text : colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Wrapping row that holds chips with consistent spacing. */
export function ChipRow({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }, style]}>
      {children}
    </View>
  );
}

/** 6px dot used for categories and priorities. Decorative by default. */
export function Dot({ color, size = 6 }: { color: string; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
    />
  );
}
