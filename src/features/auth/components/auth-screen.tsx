import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LeafIcon } from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Shared frame for sign in / sign up / password screens: brand at the top, a
 * narrow single column, and keyboard handling so fields are never hidden behind
 * the keyboard on a phone.
 */
export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: Space.xl,
          paddingTop: insets.top + Space.xxxl,
          paddingBottom: insets.bottom + Space.xxxl,
        }}
        keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 400 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: Radius.md,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <LeafIcon size={21} color={colors.accentText} />
            </View>
            <View>
              <AppText variant="heading">Pace</AppText>
            </View>
          </View>

          <AppText
            variant="title"
            accessibilityRole="header"
            style={{ marginTop: Space.xxl + Space.xs }}>
            {title}
          </AppText>
          <AppText variant="small" tone="secondary" style={{ marginTop: Space.sm }}>
            {subtitle}
          </AppText>

          <View style={{ marginTop: Space.xxl, gap: Space.lg }}>{children}</View>

          {footer ? <View style={{ marginTop: Space.xl }}>{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
