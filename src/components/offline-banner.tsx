import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useIsOnline } from '@/hooks/use-is-online';
import { useTheme } from '@/lib/use-theme';

/**
 * A small banner shown when the device is offline. Mutations are queued by
 * TanStack Query and replayed automatically when the connection returns.
 */
export function OfflineBanner() {
  const { colors } = useTheme();
  const isOnline = useIsOnline();

  if (isOnline) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.sm,
          paddingVertical: Space.sm + 2,
          paddingHorizontal: Space.lg,
          borderRadius: Radius.md,
          backgroundColor: colors.danger,
        }}>
        <AppText variant="smallStrong" color={colors.accentText} style={{ flex: 1 }}>
          You are offline. Changes will sync when you are back.
        </AppText>
      </View>
    </Animated.View>
  );
}
