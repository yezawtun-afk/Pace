import { useWindowDimensions } from 'react-native';

import { Layout } from '@/constants/theme';

/**
 * True on tablets, laptops and desktops: we switch from bottom tabs to a
 * sidebar at the same breakpoint everywhere (web and native tablets).
 */
export function useIsWide() {
  const { width } = useWindowDimensions();
  return width >= Layout.wideBreakpoint;
}
