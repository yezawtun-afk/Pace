import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, ButtonRow, TextLink } from '@/components/ui/button';
import { Chip, ChipRow } from '@/components/ui/chip';
import { FormMessage } from '@/components/ui/form-message';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { HABIT_COLORS, HABIT_ICONS } from '@/constants/habits';
import { Radius, Space } from '@/constants/theme';
import { friendlyDataError } from '@/features/auth/errors';
import { useTheme } from '@/lib/use-theme';
import type { FrequencyType, Habit } from '@/types/database';

import { WEEKDAY_LABELS, WEEK_ORDER, scheduleLabel } from '../schedule';
import { useCreateHabit, useDeleteHabit, useUpdateHabit } from '../queries';

/** Short names so the colour picker is not just "swatch 1, swatch 2". */
const COLOR_NAMES = ['Sage', 'Blue', 'Clay', 'Violet', 'Teal', 'Olive', 'Rose', 'Mint'];

const TARGETS = [1, 2, 3, 4, 5, 6, 7] as const;

type Draft = {
  name: string;
  icon: string;
  color: string;
  frequencyType: FrequencyType;
  days: number[];
  target: number;
  askForProof: boolean;
};

function draftFrom(habit: Habit | null): Draft {
  if (!habit) {
    return {
      name: '',
      icon: HABIT_ICONS[0],
      color: HABIT_COLORS[0],
      frequencyType: 'daily',
      // Sensible starting point for "chosen days": the working week.
      days: [1, 2, 3, 4, 5],
      target: 3,
      askForProof: false,
    };
  }

  return {
    name: habit.name,
    icon: habit.icon ?? HABIT_ICONS[0],
    color: habit.color,
    frequencyType: habit.frequency_type,
    days: habit.frequency_days,
    target: habit.target_per_week ?? 3,
    askForProof: habit.ask_for_proof,
  };
}

type HabitEditorProps = {
  visible: boolean;
  onClose: () => void;
  /** The habit to edit, or null to create a new one. */
  habit: Habit | null;
};

/**
 * Create or edit a habit: name, emoji, colour and how often it repeats.
 *
 * The schedule section changes shape with the choice on purpose — one concept at
 * a time beats showing weekday pickers to someone who picked "every day".
 */
export function HabitEditor({ visible, onClose, habit }: HabitEditorProps) {
  const { colors } = useTheme();

  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const [draft, setDraft] = useState<Draft>(() => draftFrom(habit));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reload the form each time it opens, but never while it is being typed in
  // (a background refetch hands us a new object for the same habit).
  const wasVisible = useRef(false);
  useEffect(() => {
    if (!visible) {
      wasVisible.current = false;
      return;
    }
    if (wasVisible.current) return;

    wasVisible.current = true;
    setDraft(draftFrom(habit));
    setError(null);
    setConfirmDelete(false);
  }, [visible, habit]);

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const saving = createHabit.isPending || updateHabit.isPending;
  const deleting = deleteHabit.isPending;

  function toggleDay(day: number) {
    setDraft((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((value) => value !== day)
        : [...current.days, day],
    }));
  }

  async function handleSave() {
    if (saving) return;

    if (!draft.name.trim()) {
      setError('Give the habit a name first.');
      return;
    }
    if (draft.frequencyType === 'weekdays' && draft.days.length === 0) {
      setError('Pick at least one day, or choose “Every day”.');
      return;
    }

    setError(null);

    const payload = {
      name: draft.name,
      icon: draft.icon,
      color: draft.color,
      frequency_type: draft.frequencyType,
      frequency_days: draft.days,
      target_per_week: draft.target,
      ask_for_proof: draft.askForProof,
    };

    try {
      if (habit) {
        await updateHabit.mutateAsync({ id: habit.id, draft: payload });
      } else {
        await createHabit.mutateAsync(payload);
      }
      onClose();
    } catch (caught) {
      setError(friendlyDataError(caught));
    }
  }

  async function handleDelete() {
    if (!habit) return;
    setError(null);
    try {
      await deleteHabit.mutateAsync(habit.id);
      onClose();
    } catch (caught) {
      setError(friendlyDataError(caught));
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={habit ? 'Edit habit' : 'New habit'}
      subtitle={
        habit
          ? 'Changing the schedule changes how streaks are counted.'
          : 'Only the name is required.'
      }
      footer={
        <View style={{ gap: Space.sm }}>
          <Button
            label={habit ? 'Save changes' : 'Create habit'}
            onPress={() => void handleSave()}
            loading={saving}
          />

          {habit ? (
            confirmDelete ? (
              <View style={{ gap: Space.sm, paddingTop: Space.xs }}>
                <AppText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
                  Delete “{habit.name}” and its whole history? This cannot be undone.
                </AppText>
                <ButtonRow>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Keep it"
                      variant="secondary"
                      onPress={() => setConfirmDelete(false)}
                      fullWidth
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Delete"
                      variant="danger"
                      onPress={() => void handleDelete()}
                      loading={deleting}
                      fullWidth
                    />
                  </View>
                </ButtonRow>
              </View>
            ) : (
              <TextLink
                label="Delete habit"
                align="center"
                tone="danger"
                onPress={() => setConfirmDelete(true)}
              />
            )
          ) : null}
        </View>
      }>
      <TextField
        label="Habit"
        value={draft.name}
        onChangeText={(name) => update({ name })}
        placeholder="e.g. Read 10 pages"
        autoFocus={!habit}
        returnKeyType="done"
        maxLength={120}
        editable={!saving}
      />

      <View style={{ gap: Space.sm }}>
        <FieldLabel>Icon</FieldLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {HABIT_ICONS.map((icon) => {
            const selected = draft.icon === icon;
            return (
              <Pressable
                key={icon}
                onPress={() => update({ icon })}
                accessibilityRole="button"
                accessibilityLabel={`Icon ${icon}`}
                accessibilityState={{ selected }}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: Radius.md,
                  borderWidth: 1,
                  borderColor: selected ? colors.accentBorder : colors.border,
                  backgroundColor: selected ? colors.accentSoft : colors.surface,
                  opacity: pressed ? 0.7 : 1,
                })}>
                <AppText style={{ fontSize: 20 }}>{icon}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: Space.sm }}>
        <FieldLabel>Colour</FieldLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {HABIT_COLORS.map((color, index) => {
            const selected = draft.color === color;
            return (
              <Pressable
                key={color}
                onPress={() => update({ color })}
                accessibilityRole="button"
                accessibilityLabel={`Colour ${COLOR_NAMES[index]}`}
                accessibilityState={{ selected }}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: selected ? colors.text : 'transparent',
                  }}>
                  <View
                    style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color }}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: Space.sm }}>
        <FieldLabel>How often</FieldLabel>
        <ChipRow>
          <Chip
            label="Every day"
            selected={draft.frequencyType === 'daily'}
            onPress={() => update({ frequencyType: 'daily' })}
          />
          <Chip
            label="Chosen days"
            selected={draft.frequencyType === 'weekdays'}
            onPress={() => update({ frequencyType: 'weekdays' })}
          />
          <Chip
            label="Times per week"
            selected={draft.frequencyType === 'weekly_target'}
            onPress={() => update({ frequencyType: 'weekly_target' })}
          />
        </ChipRow>

        {draft.frequencyType === 'weekdays' ? (
          <View style={{ gap: Space.sm, marginTop: Space.xs }}>
            <View style={{ flexDirection: 'row', gap: Space.xs + 2 }}>
              {WEEK_ORDER.map((day) => {
                const selected = draft.days.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleDay(day)}
                    accessibilityRole="button"
                    accessibilityLabel={WEEKDAY_LABELS[day]}
                    accessibilityState={{ selected }}
                    style={({ pressed }) => ({
                      flex: 1,
                      minHeight: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: selected ? colors.accentBorder : colors.border,
                      backgroundColor: selected ? colors.accentSoft : colors.surface,
                      opacity: pressed ? 0.7 : 1,
                    })}>
                    <AppText
                      variant="smallStrong"
                      color={selected ? colors.accent : colors.textSecondary}>
                      {WEEKDAY_LABELS[day].slice(0, 2)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <AppText variant="caption" tone="tertiary">
              Rest days are not counted as missed, and they do not break a streak.
            </AppText>
          </View>
        ) : null}

        {draft.frequencyType === 'weekly_target' ? (
          <View style={{ gap: Space.sm, marginTop: Space.xs }}>
            <ChipRow>
              {TARGETS.map((target) => (
                <Chip
                  key={target}
                  label={`${target}×`}
                  selected={draft.target === target}
                  accessibilityLabel={`${target} times per week`}
                  onPress={() => update({ target })}
                />
              ))}
            </ChipRow>
            <AppText variant="caption" tone="tertiary">
              Any day counts. A week is complete once you reach the target.
            </AppText>
          </View>
        ) : null}

        {draft.frequencyType === 'daily' ? (
          <AppText variant="caption" tone="tertiary" style={{ marginTop: Space.xs }}>
            Due every day, including weekends.
          </AppText>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.sm,
          paddingVertical: Space.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="smallStrong">Ask for proof</AppText>
          <AppText variant="caption" tone="tertiary">
            Offer a photo when you check this habit off.
          </AppText>
        </View>
        <Pressable
          onPress={() => update({ askForProof: !draft.askForProof })}
          accessibilityRole="switch"
          accessibilityLabel="Ask for proof"
          accessibilityState={{ checked: draft.askForProof }}
          aria-checked={draft.askForProof}
          style={({ pressed }) => ({
            width: 44,
            height: 26,
            borderRadius: 13,
            backgroundColor: draft.askForProof ? colors.accent : colors.surfaceMuted,
            justifyContent: 'center',
            paddingHorizontal: 3,
            opacity: pressed ? 0.7 : 1,
          })}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.surface,
              alignSelf: draft.askForProof ? 'flex-end' : 'flex-start',
            }}
          />
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.sm,
          paddingTop: Space.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
        <AppText variant="caption" tone="tertiary">
          Summary
        </AppText>
        <AppText variant="caption" tone="secondary" style={{ flex: 1, textAlign: 'right' }}>
          {scheduleLabel({
            frequency_type: draft.frequencyType,
            frequency_days: draft.days,
            target_per_week: draft.target,
          })}
        </AppText>
      </View>

      {error ? <FormMessage tone="error" message={error} /> : null}
    </Sheet>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <AppText variant="smallStrong">{children}</AppText>;
}
