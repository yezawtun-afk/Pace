import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { TasksIcon } from '@/components/ui/icons';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useTheme } from '@/lib/use-theme';
import { Space } from '@/constants/theme';

type Filter = 'today' | 'upcoming' | 'all' | 'completed';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Done' },
];

const EMPTY_COPY: Record<Filter, { title: string; message: string }> = {
  today: {
    title: 'Nothing due today',
    message: 'Tasks due today appear here, together with anything that slipped past its date.',
  },
  upcoming: {
    title: 'Nothing scheduled ahead',
    message: 'Future tasks are grouped by date so you can see the week without opening a calendar.',
  },
  all: {
    title: 'No tasks yet',
    message: 'Every task you add shows up here. Priorities run from P1 (urgent) to P4 (someday).',
  },
  completed: {
    title: 'Nothing completed yet',
    message: 'Finished tasks collect here so you can see what you actually got done.',
  },
};

/**
 * Task list with the four views from the brief. Phase 1 ships the filter chrome
 * and per-view empty states; phase 3 adds real data and quick add.
 */
export default function TasksScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('today');

  const empty = EMPTY_COPY[filter];

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Plan"
        title="Tasks"
        subtitle="Everything on your plate, in one list."
      />

      <SegmentedControl
        accessibilityLabel="Filter tasks"
        options={FILTERS}
        value={filter}
        onChange={setFilter}
      />

      <View style={{ marginTop: Space.xxl }}>
        <EmptyState
          icon={<TasksIcon size={20} color={colors.textTertiary} />}
          title={empty.title}
          message={empty.message}
        />
      </View>
    </Screen>
  );
}
