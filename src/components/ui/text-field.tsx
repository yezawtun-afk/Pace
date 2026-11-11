import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { EyeIcon, EyeOffIcon } from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { FontFamily, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown under the field and turns the border red. */
  error?: string | null;
  /** Small helper text, hidden while an error is shown. */
  hint?: string;
  /** Renders a show/hide eye button. */
  secure?: boolean;
  /** Taller box for long writing; multiline fields default to 96. */
  minHeight?: number;
};

/**
 * Labelled text input with focus, error and password states. The tap target for
 * the reveal button is 44×44 so it is comfortable on a phone.
 */
export function TextField({
  label,
  error,
  hint,
  secure = false,
  minHeight,
  ...inputProps
}: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.accent : colors.border;
  const isMultiline = Boolean(inputProps.multiline);

  return (
    <View style={{ gap: Space.xs + 2 }}>
      <AppText variant="smallStrong">{label}</AppText>

      <View
        style={{
          flexDirection: 'row',
          alignItems: isMultiline ? 'flex-start' : 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor,
          borderRadius: Radius.md,
          paddingLeft: Space.md + 2,
          paddingRight: secure ? Space.xxs : Space.md + 2,
        }}>
        <TextInput
          {...inputProps}
          secureTextEntry={secure && !revealed}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          placeholderTextColor={colors.textTertiary}
          style={{
            flex: 1,
            minHeight: minHeight ?? (isMultiline ? 96 : 46),
            paddingTop: isMultiline ? Space.md : Space.sm,
            paddingBottom: Space.sm,
            color: colors.text,
            fontFamily: FontFamily,
            fontSize: 16,
            textAlignVertical: isMultiline ? 'top' : 'auto',
          }}
        />

        {secure ? (
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}>
            {revealed ? (
              <EyeOffIcon size={19} color={colors.textTertiary} />
            ) : (
              <EyeIcon size={19} color={colors.textTertiary} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="tertiary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
