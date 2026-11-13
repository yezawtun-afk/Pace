import { useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { AppText } from '@/components/ui/text';
import { Screen } from '@/components/ui/screen';
import { Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';
import { fetchSharedPace } from '@/features/sharing/api';
import type { SharedPace } from '@/features/sharing/api';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export default function SharedPaceScreen() {
  const { colors } = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [data, setData] = useState<SharedPace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    fetchSharedPace(token, SUPABASE_URL)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <Screen>
        <EmptyState title="Pace link unavailable" message="Missing link." />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <View style={{ paddingVertical: Space.huge, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <EmptyState
          title="Pace link unavailable"
          message={error ?? 'This link may have been revoked.'}
        />
      </Screen>
    );
  }

  const total = data.habitsTotal + data.tasksTotal;
  const done = data.habitsDone + data.tasksDone;
  const ratio = total > 0 ? done / total : 0;

  const counts = [
    data.habitsTotal > 0 ? `Habits ${data.habitsDone}/${data.habitsTotal}` : null,
    data.tasksTotal > 0 ? `Tasks ${data.tasksDone}/${data.tasksTotal}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: Space.lg, paddingTop: Space.xxl }}>
        <AppText variant="overline" tone="tertiary">
          {data.displayName ? `${data.displayName}'s pace` : "A friend's pace"}
        </AppText>
        <AppText variant="heading">{format(parseISO(data.date), 'EEEE d MMMM')}</AppText>

        <Card>
          <View style={{ gap: Space.md, paddingVertical: Space.lg }}>
            <View style={{ alignItems: 'center', gap: Space.xs }}>
              <AppText variant="title">{Math.round(ratio * 100)}%</AppText>
              <AppText variant="caption" tone="tertiary">
                {done} of {total} done today
              </AppText>
            </View>

            <ProgressBar ratio={ratio} />

            {counts ? (
              <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
                {counts}
              </AppText>
            ) : null}
          </View>
        </Card>

        <AppText variant="caption" tone="tertiary">
          Shared from Pace. Read-only.
        </AppText>
      </View>
    </Screen>
  );
}
