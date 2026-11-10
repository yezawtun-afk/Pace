import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

type DividerProps = {
  /** Optional word in the middle, e.g. "or". */
  label?: string;
};

/**
 * Hairline rule that separates two choices. With a label it reads as
 * "these are alternative paths" rather than "this is a new section".
 */
export function Divider({ label }: DividerProps) {
  const { colors } = useTheme();

  const line = <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />;

  if (!label) {
    return <View style={{ height: 1, backgroundColor: colors.border }} />;
  }

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}
      accessibilityElementsHidden
      importantForAccessibility="no">
      {line}
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
      {line}
    </View>
  );
}
