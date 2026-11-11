import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Layout, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type Option<T extends string> = {
  value: T;
  label: string;
  /** Receives the colour the icon should be drawn in. */
  renderIcon?: (color: string) => ReactNode;
};

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/**
 * Compact multi-choice switch (iOS-style segmented control). Used for the theme
 * picker today and for task filters later.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceMuted,
        borderRadius: Radius.md,
        padding: 3,
        alignSelf: 'flex-start',
      }}>
      {options.map((option) => {
        const selected = option.value === value;
        const contentColor = selected ? colors.text : colors.textSecondary;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            aria-checked={selected}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Space.sm,
                minHeight: Layout.minTapTarget - 6,
                paddingHorizontal: Space.lg,
                borderRadius: Radius.sm + 1,
                backgroundColor: selected ? colors.surface : 'transparent',
                borderWidth: 1,
                borderColor: selected ? colors.border : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            {option.renderIcon ? option.renderIcon(contentColor) : null}
            <AppText variant={selected ? 'smallStrong' : 'small'} color={contentColor}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
