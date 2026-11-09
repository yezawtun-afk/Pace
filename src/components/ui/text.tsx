import { Text, type TextProps, type TextStyle } from 'react-native';

import { FontFamily, Type, type TypeVariant } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type Tone = 'default' | 'secondary' | 'tertiary' | 'accent' | 'danger';

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  tone?: Tone;
  /** Escape hatch for one-off colours (e.g. priority dots). */
  color?: string;
};

/**
 * All text in the app goes through here, so the type scale stays consistent and
 * every label respects the current theme. `tone` maps to a semantic colour
 * instead of a raw hex value.
 */
export function AppText({
  variant = 'body',
  tone = 'default',
  color,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  const toneColor: Record<Tone, string> = {
    default: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    accent: colors.accent,
    danger: colors.danger,
  };

  return (
    <Text
      {...rest}
      // Display text gets a slightly lower cap so very large system fonts
      // cannot push the layout apart.
      maxFontSizeMultiplier={variant === 'display' || variant === 'title' ? 1.5 : 2}
      style={[
        { fontFamily: FontFamily },
        Type[variant] as TextStyle,
        { color: color ?? toneColor[tone] },
        style,
      ]}
    />
  );
}
