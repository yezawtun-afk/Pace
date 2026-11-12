import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { ImageIcon } from '@/components/ui/icons';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type ProofThumbnailProps = {
  uri: string | null;
  size?: number;
  onPress?: () => void;
};

/**
 * A small rounded thumbnail of a proof photo. Without a photo it shows an
 * empty frame, so a row keeps its shape while the signed URL is in flight.
 */
export function ProofThumbnail({ uri, size = 40, onPress }: ProofThumbnailProps) {
  const { colors } = useTheme();

  const content = uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: Radius.sm }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={120}
      accessibilityLabel="Proof photo"
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
      <ImageIcon size={Math.max(14, Math.round(size * 0.4))} color={colors.textTertiary} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Open proof photo"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}
