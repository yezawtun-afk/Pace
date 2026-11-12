import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Layout, Radius, Space } from '@/constants/theme';
import { pointerCursor, type PressableState } from '@/lib/web';
import { useTheme } from '@/lib/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  /** Defaults to true; set false for inline buttons in a row. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

/**
 * The one button in the app. Always at least 44px tall, shows a spinner while
 * busy, and reports its disabled/busy state to screen readers.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary'
      ? colors.accent
      : variant === 'secondary'
        ? colors.surface
        : variant === 'danger'
          ? colors.dangerSoft
          : 'transparent';
  const hoverBackground =
    variant === 'primary'
      ? colors.accentHover
      : variant === 'secondary' || variant === 'quiet'
        ? colors.surfaceMuted
        : colors.dangerSoft;
  const foreground =
    variant === 'primary'
      ? colors.accentText
      : variant === 'secondary'
        ? colors.text
        : variant === 'danger'
          ? colors.danger
          : colors.accent;
  const borderColor = variant === 'secondary' ? colors.border : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed, hovered }: PressableState) => [
        pointerCursor,
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Space.sm,
          minHeight: Layout.minTapTarget + 4,
          paddingHorizontal: Space.xl,
          borderRadius: Radius.md,
          backgroundColor: hovered && !isDisabled ? hoverBackground : background,
          borderWidth: 1,
          borderColor,
          opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
        },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}>
      {loading ? <ActivityIndicator size="small" color={foreground} /> : null}
      <AppText variant="bodyStrong" color={foreground}>
        {label}
      </AppText>
    </Pressable>
  );
}

type TextLinkProps = {
  label: string;
  onPress: () => void;
  align?: 'left' | 'right' | 'center';
  /** Use "danger" for destructive actions such as deleting. */
  tone?: 'accent' | 'danger';
};

/** Quiet text button for "Forgot password?", "Create an account", … */
export function TextLink({ label, onPress, align = 'left', tone = 'accent' }: TextLinkProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      hitSlop={8}
      style={({ pressed, hovered }: PressableState) => [
        pointerCursor,
        {
          alignSelf: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          // Keeps the touch target honest without making the text look like a button.
          minHeight: 32,
          justifyContent: 'center',
          paddingVertical: Space.xs,
          paddingHorizontal: Space.xs,
          borderRadius: Radius.sm,
          backgroundColor: hovered ? colors.surfaceMuted : 'transparent',
          opacity: pressed ? 0.6 : 1,
        },
      ]}>
      <AppText variant="smallStrong" color={tone === 'danger' ? colors.danger : colors.accent}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Horizontal pair of actions, e.g. "Back" and "Continue". */
export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: Space.md }}>{children}</View>;
}
