import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Layout, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'quiet';

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
    variant === 'primary' ? colors.accent : variant === 'secondary' ? colors.surface : 'transparent';
  const foreground =
    variant === 'primary' ? colors.accentText : variant === 'secondary' ? colors.text : colors.accent;
  const borderColor = variant === 'secondary' ? colors.border : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Space.sm,
          minHeight: Layout.minTapTarget + 4,
          paddingHorizontal: Space.xl,
          borderRadius: Radius.md,
          backgroundColor: background,
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
};

/** Quiet text button for "Forgot password?", "Create an account", … */
export function TextLink({ label, onPress, align = 'left' }: TextLinkProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      hitSlop={8}
      style={({ pressed }) => ({
        alignSelf: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        paddingVertical: Space.sm,
        opacity: pressed ? 0.6 : 1,
      })}>
      <AppText variant="smallStrong" color={colors.accent}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Horizontal pair of actions, e.g. "Back" and "Continue". */
export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: Space.md }}>{children}</View>;
}
