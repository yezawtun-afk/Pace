import { Platform } from 'react-native';

/** True when the app is running in a browser. */
export const isWeb = Platform.OS === 'web';

/**
 * Pressable style callbacks receive `hovered` and `focused` from React Native
 * Web, but React Native's own types only declare `pressed`. This type describes
 * what the callback actually gets so components can use the extra fields
 * without a cast.
 */
export type PressableState = {
  pressed: boolean;
  hovered?: boolean;
  focused?: boolean;
};

/** `cursor: pointer` for web pressables; native does not have a cursor. */
export const pointerCursor = isWeb ? ({ cursor: 'pointer' } as const) : null;
