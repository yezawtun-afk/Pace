import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { Layout, Radius, Space } from '@/constants/theme';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/lib/use-theme';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Optional line under the title. */
  subtitle?: string;
  children: ReactNode;
  /** Sticky row at the bottom (Save, Cancel, …). */
  footer?: ReactNode;
};

/**
 * Bottom sheet on phones, centred card on wide screens.
 *
 * Built on React Native's `Modal` rather than a router modal so the screen
 * underneath stays mounted (no refetch, no lost scroll position) and the same
 * code works on web, Android and iOS. Tapping the dimmed area closes it, and
 * the panel is marked as a modal for screen readers.
 */
export function Sheet({ visible, onClose, title, subtitle, children, footer }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isWide = useIsWide();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWide ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: isWide ? 'center' : 'flex-end',
          alignItems: 'center',
        }}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%', maxWidth: isWide ? 560 : undefined, maxHeight: '92%' }}>
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: Radius.xl,
              borderTopRightRadius: Radius.xl,
              borderBottomLeftRadius: isWide ? Radius.xl : 0,
              borderBottomRightRadius: isWide ? Radius.xl : 0,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              // Wait for the sheet to be on screen before focusing a field.
              paddingBottom: isWide ? 0 : insets.bottom,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: Space.md,
                paddingHorizontal: Space.xl,
                paddingTop: Space.xl,
                paddingBottom: Space.md,
              }}>
              <View style={{ flex: 1, gap: Space.xxs }}>
                <AppText variant="heading" accessibilityRole="header">
                  {title}
                </AppText>
                {subtitle ? (
                  <AppText variant="caption" tone="tertiary">
                    {subtitle}
                  </AppText>
                ) : null}
              </View>

              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={({ pressed }) => ({
                  width: Layout.minTapTarget,
                  height: Layout.minTapTarget,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}>
                <CloseIcon size={20} color={colors.textTertiary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: Space.xl,
                paddingBottom: Space.xl,
                gap: Space.xl,
              }}
              keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>

            {footer ? (
              <View
                style={{
                  paddingHorizontal: Space.xl,
                  paddingTop: Space.md,
                  paddingBottom: Space.lg,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  backgroundColor: colors.surface,
                  gap: Space.sm,
                }}>
                {footer}
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
