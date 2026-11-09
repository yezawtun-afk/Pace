import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type SectionHeaderProps = {
  title: string;
  /** Optional item count shown as a small pill. */
  count?: number;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Title row above a group of cards or list rows. */
export function SectionHeader({ title, count, action, style }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.sm,
          marginBottom: Space.md,
        },
        style,
      ]}>
      <AppText variant="heading">{title}</AppText>

      {typeof count === 'number' ? (
        <View
          style={{
            minWidth: 22,
            paddingHorizontal: Space.sm,
            paddingVertical: 1,
            borderRadius: Radius.pill,
            backgroundColor: colors.surfaceMuted,
            alignItems: 'center',
          }}>
          <AppText variant="caption" tone="secondary">
            {count}
          </AppText>
        </View>
      ) : null}

      <View style={{ flex: 1 }} />
      {action}
    </View>
  );
}
