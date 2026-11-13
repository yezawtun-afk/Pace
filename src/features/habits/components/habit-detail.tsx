import { startOfMonth } from 'date-fns';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, TextLink } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { FlameIcon } from '@/components/ui/icons';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { ProofViewer } from '@/features/proofs/components/proof-viewer';
import { useProofUrl } from '@/features/proofs/queries';
import { useTheme } from '@/lib/use-theme';
import type { Habit } from '@/types/database';

import { scheduleLabel } from '../schedule';
import { currentStreak, ratePercent, restDayBank, streakLabel, weekBuckets } from '../stats';
import { MonthHeatmap } from './month-heatmap';
import { WeekBars } from './week-bars';

type HabitDetailProps = {
  visible: boolean;
  habit: Habit;
  /** "yyyy-MM-dd" keys of the days this habit was done. */
  done: Set<string>;
  today: Date;
  /** "yyyy-MM-dd" â†’ storage path, for days with a proof photo. */
  proofs?: Map<string, string>;
  onClose: () => void;
  onEdit: () => void;
  onToggleDay: (date: string) => void;
  onDelete: () => void;
  deleting: boolean;
  /** Set when the delete request failed. */
  error?: string | null;
};

const RATE_WINDOWS = [7, 30, 90] as const;

/**
 * Everything about one habit: its streak in its own rhythm, three completion
 * rates, a month heatmap you can tap to back-fill, and the last eight weeks as
 * small bars. Editing and deleting live here too, so the list stays quiet.
 */
export function HabitDetail({
  visible,
  habit,
  done,
  today,
  proofs,
  onClose,
  onEdit,
  onToggleDay,
  onDelete,
  deleting,
  error,
}: HabitDetailProps) {
  const { colors } = useTheme();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewerPath, setViewerPath] = useState<string | null>(null);
  const viewerUrl = useProofUrl(viewerPath).data ?? null;

  const streak = currentStreak(habit, done, today);
  const buckets = weekBuckets(habit, done, today, 8);
  const weekly = habit.frequency_type === 'weekly_target';
  const bank = restDayBank(habit, done, today);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={habit.name}
      subtitle={scheduleLabel(habit)}
      footer={
        <View style={{ gap: Space.sm }}>
          <Button label="Edit habit" onPress={onEdit} />
          <Button label="Close" variant="quiet" onPress={onClose} fullWidth />
        </View>
      }>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.lg,
          padding: Space.lg,
          borderRadius: Radius.lg,
          backgroundColor: colors.surfaceMuted,
        }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: Radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accentSoft,
          }}>
          <FlameIcon size={26} color={colors.accent} />
        </View>

        <View style={{ flex: 1, gap: Space.xxs }}>
          <AppText variant="title">{streakLabel(streak, habit)}</AppText>
          <AppText variant="caption" tone="secondary">
            {weekly
              ? `A week counts once it reaches ${habit.target_per_week ?? 1}Ã—. The current week can still be finished.`
              : 'Rest days do not break a streak, and today is never counted as missed.'}
          </AppText>
          {bank.banked > 0 ? (
            <AppText variant="caption" tone="tertiary">
              {bank.balance} of {bank.banked} rest {bank.banked === 1 ? 'day' : 'days'} banked
              {bank.spent > 0 ? ` Â· ${bank.spent} spent this week` : ''}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {RATE_WINDOWS.map((days, index) => (
          <View
            key={days}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: Space.xxs,
              paddingVertical: Space.md,
              borderWidth: 1,
              borderColor: colors.border,
              borderLeftWidth: index === 0 ? 1 : 0,
              borderTopLeftRadius: index === 0 ? Radius.md : 0,
              borderBottomLeftRadius: index === 0 ? Radius.md : 0,
              borderTopRightRadius: index === RATE_WINDOWS.length - 1 ? Radius.md : 0,
              borderBottomRightRadius: index === RATE_WINDOWS.length - 1 ? Radius.md : 0,
            }}>
            <AppText variant="title">{ratePercent(habit, done, days, today)}%</AppText>
            <AppText variant="caption" tone="tertiary">
              last {days} days
            </AppText>
          </View>
        ))}
      </View>

      <View style={{ gap: Space.sm }}>
        <FieldLabel>History</FieldLabel>
        <MonthHeatmap
          habit={habit}
          month={month}
          done={done}
          proofs={proofs}
          today={today}
          onChangeMonth={setMonth}
          onToggleDay={onToggleDay}
          onOpenProof={(date) => {
            const path = proofs?.get(date);
            if (path) setViewerPath(path);
          }}
        />
        <AppText variant="caption" tone="tertiary">
          Tap any past day to check it in or clear it. Filled squares are days you did it; a dot
          marks a day with a photo.
        </AppText>
      </View>

      <View style={{ gap: Space.sm }}>
        <FieldLabel>Last 8 weeks</FieldLabel>
        <WeekBars buckets={buckets} color={habit.color} />
      </View>

      {error ? <FormMessage tone="error" message={error} /> : null}

      {confirmDelete ? (
        <View
          style={{
            gap: Space.sm,
            padding: Space.md,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: `${colors.danger}40`,
            backgroundColor: colors.dangerSoft,
          }}>
          <AppText variant="small" tone="secondary">
            Delete â€œ{habit.name}â€ and its whole history? This cannot be undone.
          </AppText>
          <View style={{ flexDirection: 'row', gap: Space.lg }}>
            <TextLink label="Delete" tone="danger" onPress={onDelete} />
            <TextLink label="Cancel" onPress={() => setConfirmDelete(false)} />
          </View>
        </View>
      ) : (
        <TextLink
          label={deleting ? 'Deletingâ€¦' : 'Delete habit'}
          align="center"
          tone="danger"
          onPress={() => setConfirmDelete(true)}
        />
      )}

      {viewerPath ? (
        <ProofViewer visible uri={viewerUrl} onClose={() => setViewerPath(null)} />
      ) : null}
    </Sheet>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <AppText variant="smallStrong">{children}</AppText>;
}
