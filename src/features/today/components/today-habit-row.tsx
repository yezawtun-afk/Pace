import { memo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { FlameIcon } from '@/components/ui/icons';
import { AppText } from '@/components/ui/text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';

import { HabitBadge } from '@/features/habits/components/habit-badge';
import { currentStreak, streakLabel } from '@/features/habits/stats';
import { ProofThumbnail } from '@/features/proofs/components/proof-thumbnail';
import { ProofViewer } from '@/features/proofs/components/proof-viewer';
import { useProofUrl } from '@/features/proofs/queries';
import { pointerCursor, type PressableState } from '@/lib/web';
import type { TodayHabit } from '../summary';

type TodayHabitRowProps = {
  entry: TodayHabit;
  /** Days this habit was done, as "yyyy-MM-dd" keys. */
  done: Set<string>;
  today: Date;
  onToggle: () => void;
  onOpen: () => void;
  /** Storage path of today's proof photo, when one was added. */
  proofPath?: string | null;
  /** Called from the photo viewer to pick a different photo. */
  onReplaceProof?: () => void;
  /** Called from the photo viewer to delete the photo. */
  onRemoveProof?: () => void;
  /** Removes the divider under the last row of a card. */
  last?: boolean;
};

/**
 * One habit on Today: a small badge, the name, the streak, and the check box.
 * Tapping the name opens the habit in the Habits tab for the full history.
 * When today has a proof photo, a small thumbnail sits next to the checkbox and
 * opens the full-screen viewer.
 *
 * Memoised so a proof uploading on one row does not re-render the others.
 */
export const TodayHabitRow = memo(function TodayHabitRow({
  entry,
  done,
  today,
  onToggle,
  onOpen,
  proofPath,
  onReplaceProof,
  onRemoveProof,
  last = false,
}: TodayHabitRowProps) {
  const { colors } = useTheme();
  const { habit, done: isDoneToday, restDay } = entry;
  const [viewerOpen, setViewerOpen] = useState(false);

  const proofUrl = useProofUrl(proofPath).data ?? null;

  const streak = currentStreak(habit, done, today);
  const streakText = streakLabel(streak, habit);
  const state = isDoneToday ? 'done' : restDay ? 'rest day check-in' : 'not done today';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: Space.md,
        paddingRight: Space.xs,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${state}, ${streakText}. Open in Habits.`}
        style={({ pressed, hovered }: PressableState) => [
          pointerCursor,
          {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Space.md,
            paddingVertical: Space.sm + 2,
            paddingHorizontal: Space.xs,
            marginVertical: Space.xxs,
            borderRadius: Radius.sm,
            backgroundColor: hovered ? colors.surfaceMuted : 'transparent',
            opacity: pressed ? 0.65 : 1,
          },
        ]}>
        <HabitBadge icon={habit.icon} color={habit.color} size={34} />

        <View style={{ flex: 1, gap: 2 }}>
          <AppText
            variant="bodyStrong"
            tone={isDoneToday ? 'secondary' : 'default'}
            numberOfLines={2}>
            {habit.name}
          </AppText>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.xs + 1 }}>
            {streak > 0 ? <FlameIcon size={12} color={colors.accent} /> : null}
            <AppText variant="caption" tone={streak > 0 ? 'accent' : 'tertiary'}>
              {streakText}
            </AppText>
            {restDay ? (
              <AppText variant="caption" tone="tertiary">
                · Rest day check-in
              </AppText>
            ) : null}
          </View>
        </View>
      </Pressable>

      {proofPath ? (
        <View style={{ marginRight: Space.xs }}>
          <ProofThumbnail uri={proofUrl} size={30} onPress={() => setViewerOpen(true)} />
        </View>
      ) : null}

      <Checkbox
        checked={isDoneToday}
        onPress={onToggle}
        label={
          isDoneToday ? `Mark ${habit.name} as not done today` : `Mark ${habit.name} as done today`
        }
      />

      {viewerOpen ? (
        <ProofViewer
          visible
          uri={proofUrl}
          onClose={() => setViewerOpen(false)}
          onReplace={
            onReplaceProof
              ? () => {
                  setViewerOpen(false);
                  onReplaceProof();
                }
              : undefined
          }
          onRemove={
            onRemoveProof
              ? () => {
                  setViewerOpen(false);
                  onRemoveProof();
                }
              : undefined
          }
        />
      ) : null}
    </View>
  );
});
