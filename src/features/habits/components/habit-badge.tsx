import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius } from '@/constants/theme';

type HabitBadgeProps = {
  icon: string | null;
  color: string;
  size?: number;
};

/**
 * The emoji tile that identifies a habit. The colour is a 15% tint of the
 * habit's own colour, so it sits on both the light and the dark surface.
 */
export function HabitBadge({ icon, color, size = 42 }: HabitBadgeProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: Radius.md,
        // A two-digit hex alpha keeps one token doing both jobs.
        backgroundColor: `${color}26`,
        borderWidth: 1,
        borderColor: `${color}40`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <AppText style={{ fontSize: size * 0.45 }}>{icon ?? '🌿'}</AppText>
    </View>
  );
}
