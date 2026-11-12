import { Image } from 'expo-image';
import { Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { CloseIcon } from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type ProofViewerProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  onReplace?: () => void;
  onRemove?: () => void;
};

/**
 * Full-screen viewer for a proof photo, with replace and remove actions.
 */
export function ProofViewer({ visible, uri, onClose, onReplace, onRemove }: ProofViewerProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: Space.lg,
        }}>
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: Space.xl, right: Space.xl, zIndex: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <CloseIcon size={24} color={colors.accentText} />
        </Pressable>

        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '70%', borderRadius: Radius.md }}
            contentFit="contain"
          />
        ) : (
          <AppText variant="body" color={colors.accentText}>
            No photo
          </AppText>
        )}

        <View style={{ flexDirection: 'row', gap: Space.sm, marginTop: Space.lg }}>
          {onReplace ? <Button label="Replace" onPress={onReplace} fullWidth={false} /> : null}
          {onRemove ? (
            <Button label="Remove" variant="danger" onPress={onRemove} fullWidth={false} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
