import type { ReactNode } from 'react';
import {
  ScrollView,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Layout, Space } from '@/constants/theme';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/lib/use-theme';

type ScreenProps = {
  children: ReactNode;
  /** Turn off for screens that manage their own scrolling (e.g. calendars). */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: ScrollViewProps['refreshControl'];
};

/**
 * Standard page frame:
 * - respects the notch / status bar,
 * - caps the line length at 720px and centres it on wide screens,
 * - keeps the background in sync with the theme.
 */
export function Screen({ children, scroll = true, contentStyle, refreshControl }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isWide = useIsWide();

  const paddingTop = isWide ? Space.xxxl + Space.sm : insets.top + Space.xl;
  const paddingHorizontal = isWide ? Space.xxl : Space.xl;

  const inner = (
    <View style={[{ width: '100%', maxWidth: Layout.contentMaxWidth }, contentStyle]}>
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop,
          paddingHorizontal,
          alignItems: 'center',
        }}>
        {inner}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop,
        paddingBottom: Space.xxxl + Space.lg,
        paddingHorizontal,
        alignItems: 'center',
      }}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}>
      {inner}
    </ScrollView>
  );
}

type ScreenHeaderProps = {
  /** Small uppercase label above the title, e.g. the date. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function ScreenHeader({ eyebrow, title, subtitle, action }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: Space.xxl }}>
      {eyebrow ? (
        <AppText variant="overline" tone="tertiary" style={{ marginBottom: Space.sm }}>
          {eyebrow}
        </AppText>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Space.lg }}>
        <View style={{ flex: 1 }}>
          <AppText variant="display" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="small" tone="secondary" style={{ marginTop: Space.sm }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {action ? <View style={{ paddingTop: Space.xs }}>{action}</View> : null}
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: colors.border,
          marginTop: Space.xl,
        }}
      />
    </View>
  );
}
