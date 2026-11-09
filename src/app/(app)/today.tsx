import { format } from 'date-fns';
import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { HabitsIcon, TasksIcon } from '@/components/ui/icons';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The home screen: habits due today, tasks due or overdue, and one progress
 * ring that answers "how is today going?" without reading a single number.
 *
 * Phase 1 renders the real layout with empty data; phases 3–5 wire it up.
 */
export default function TodayScreen() {
  const { colors } = useTheme();
  const now = new Date();

  const habitsDone = 0;
  const habitsTotal = 0;
  const tasksDone = 0;
  const tasksTotal = 0;

  const done = habitsDone + tasksDone;
  const total = habitsTotal + tasksTotal;
  const progress = total === 0 ? 0 : done / total;

  return (
    <Screen>
      <ScreenHeader
        eyebrow={format(now, 'EEEE d MMMM')}
        title={greetingFor(now)}
        subtitle="Everything for today, in one calm place."
      />

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.xl }}>
          <ProgressRing
            value={progress}
            size={88}
            accessibilityLabel={`${done} of ${total} items completed today`}>
            <AppText variant="heading">
              {done}/{total}
            </AppText>
            <AppText variant="caption" tone="tertiary">
              done
            </AppText>
          </ProgressRing>

          <View style={{ flex: 1, gap: Space.xs + 2 }}>
            <AppText variant="bodyStrong">
              {total === 0 ? 'Nothing scheduled yet' : `${done} of ${total} done today`}
            </AppText>
            <AppText variant="small" tone="secondary">
              Habits and tasks you add will appear here, ready to be checked off one by one.
            </AppText>
          </View>
        </View>
      </Card>

      <View style={{ marginTop: Space.xxxl }}>
        <SectionHeader title="Habits" count={habitsTotal} />
        <EmptyState
          icon={<HabitsIcon size={20} color={colors.textTertiary} />}
          title="No habits yet"
          message="Daily practices you create will show up here on the days they are due, with their current streak."
        />
      </View>

      <View style={{ marginTop: Space.xxl }}>
        <SectionHeader title="Tasks" count={tasksTotal} />
        <EmptyState
          icon={<TasksIcon size={20} color={colors.textTertiary} />}
          title="No tasks for today"
          message="Tasks due today — and anything overdue — will be waiting here. Completing one takes a single tap."
        />
      </View>
    </Screen>
  );
}
