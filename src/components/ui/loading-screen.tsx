import { ActivityIndicator, View } from 'react-native';

import { LeafIcon } from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * Full-screen "we are getting ready" state. Shown while the saved session and
 * the user's profile are being read, so nobody sees a sign-in form flash for a
 * frame before landing on Today.
 */
export function LoadingScreen({ message = 'Finding your pace…' }: { message?: string }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Space.md,
        backgroundColor: colors.background,
      }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: Radius.md + 2,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <LeafIcon size={24} color={colors.accentText} />
      </View>
      <ActivityIndicator color={colors.accent} />
      <AppText variant="caption" tone="tertiary">
        {message}
      </AppText>
    </View>
  );
}
