import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Set false when the card contains its own padded children (e.g. lists). */
  padded?: boolean;
};

/**
 * The workhorse surface: white (or near-black) panel with a hairline border and
 * generous padding. Borders instead of shadows keep it calm and Notion-like.
 */
export function Card({ children, style, padded = true }: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          // Keeps hover tints and list dividers inside the rounded corners.
          overflow: 'hidden',
        },
        padded && { padding: Space.xl },
        style,
      ]}>
      {children}
    </View>
  );
}
