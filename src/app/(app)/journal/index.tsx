import { View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { JournalIcon } from '@/components/ui/icons';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { useTheme } from '@/lib/use-theme';

/**
 * Journal history: one entry per day, searchable and filterable.
 * Phase 1 ships the frame and the empty state; phase 6 adds entries.
 */
export default function JournalScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Reflection"
        title="Journal"
        subtitle="A few honest lines at the end of the day."
      />

      <View>
        <EmptyState
          icon={<JournalIcon size={20} color={colors.textTertiary} />}
          title="No entries yet"
          message="Each evening review is saved here as one entry for that day — with your mood, tags and what you got done."
        />
      </View>
    </Screen>
  );
}
