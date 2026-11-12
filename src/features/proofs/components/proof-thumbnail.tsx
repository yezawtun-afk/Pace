import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type ProofThumbnailProps = {
  uri: string | null;
  size?: number;
  onPress?: () => void;
};

/**
 * A small rounded thumbnail of a proof photo. Shows a placeholder when there
 * is no photo yet.
 */
export function ProofThumbnail({ uri, size = 40, onPress }: ProofThumbnailProps) {
  const { colors } = useTheme();

  const content = uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: Radius.sm }}
      contentFit="cover"
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Radius.sm,
        backgroundColor: colors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <AppText variant="caption" tone="tertiary">
        photo
      </AppText>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Open proof photo">
        {content}
      </Pressable>
    );
  }

  return content;
}
