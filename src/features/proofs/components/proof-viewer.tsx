import { Image } from 'expo-image';
import { Modal, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { CloseIcon } from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { Motion, Radius, Space } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/lib/use-theme';

type ProofViewerProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  onReplace?: () => void;
  onRemove?: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

/**
 * Full-screen viewer for a proof photo.
 *
 * Pinch to zoom (1×–4×) and double-tap to jump between fit and 2×; on the web
 * the trackpad pinch and double-click both work. Mount it only while it is open
 * (the callers do), so every photo starts at fit size.
 */
export function ProofViewer({ visible, uri, onClose, onReplace, onRemove }: ProofViewerProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  const scale = useSharedValue(1);
  const restingScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(restingScale.value * event.scale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      restingScale.value = scale.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = restingScale.value > 1 ? 1 : 2;
      restingScale.value = next;
      scale.value = reducedMotion ? next : withTiming(next, { duration: Motion.base });
    });

  const imageStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

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
          hitSlop={12}
          style={{ position: 'absolute', top: Space.xl, right: Space.xl, zIndex: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Close photo">
          <CloseIcon size={24} color={colors.accentText} />
        </Pressable>

        {uri ? (
          <GestureDetector gesture={Gesture.Exclusive(doubleTap, pinch)}>
            <Animated.View
              style={[
                { width: '100%', height: '72%', borderRadius: Radius.md, overflow: 'hidden' },
                imageStyle,
              ]}>
              <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                cachePolicy="memory-disk"
                accessibilityLabel="Proof photo"
              />
            </Animated.View>
          </GestureDetector>
        ) : (
          <AppText variant="body" color={colors.accentText}>
            Photo is still loading.
          </AppText>
        )}

        {onReplace || onRemove ? (
          <View style={{ flexDirection: 'row', gap: Space.sm, marginTop: Space.lg }}>
            {onReplace ? <Button label="Replace" onPress={onReplace} fullWidth={false} /> : null}
            {onRemove ? (
              <Button label="Remove" variant="danger" onPress={onRemove} fullWidth={false} />
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
