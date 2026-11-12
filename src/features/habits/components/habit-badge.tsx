import { View } from 'react-native';

import { HabitGlyph } from '@/components/ui/icons';
import { DEFAULT_HABIT_ICON, habitIconKey } from '@/constants/habits';
import { Radius } from '@/constants/theme';

type HabitBadgeProps = {
  icon: string | null;
  color: string;
  size?: number;
};

/**
 * The tile that identifies a habit. The colour is a 15% tint of the habit's own
 * colour, so it sits on both the light and the dark surface; the glyph is drawn
 * in the habit colour at half the tile size.
 *
 * Rows created before the SVG set stored an emoji, and `habitIconKey` maps it;
 * anything unknown falls back to the leaf rather than leaving a blank tile.
 */
export function HabitBadge({ icon, color, size = 42 }: HabitBadgeProps) {
  const key = habitIconKey(icon) ?? DEFAULT_HABIT_ICON;

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
      <HabitGlyph name={key} size={Math.round(size * 0.5)} color={color} />
    </View>
  );
}
