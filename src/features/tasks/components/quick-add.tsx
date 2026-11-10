import { addDays } from 'date-fns';
import { useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { FormMessage } from '@/components/ui/form-message';
import { PlusIcon } from '@/components/ui/icons';
import { FontFamily, Layout, Radius, Space } from '@/constants/theme';
import { friendlyDataError } from '@/features/auth/errors';
import { useTheme } from '@/lib/use-theme';

import { toDateString, todayString } from '../grouping';
import { useCreateTask } from '../queries';
import type { TaskView } from '../grouping';

type QuickAddProps = {
  /** Shown inside the field so it is obvious where the task will land. */
  placeholder: string;
  /** Date applied to a new task from this view, or null for "no date". */
  dueDate: string | null;
};

/**
 * One-line task entry. Enter (or the + button) saves and keeps the keyboard up,
 * so "three things before coffee" takes three lines and three Enters.
 */
export function QuickAdd({ placeholder, dueDate }: QuickAddProps) {
  const { colors } = useTheme();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;

    setError(null);
    try {
      await createTask.mutateAsync({ title: trimmed, due_date: dueDate });
      setTitle('');
      inputRef.current?.focus();
    } catch (caught) {
      setError(friendlyDataError(caught));
    }
  }

  return (
    <View style={{ gap: Space.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.sm,
          paddingLeft: Space.md + 2,
          paddingRight: Space.xs,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}>
        <TextInput
          ref={inputRef}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={handleAdd}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={placeholder}
          returnKeyType="done"
          submitBehavior="submit"
          maxLength={200}
          style={{
            flex: 1,
            minHeight: 46,
            paddingVertical: Space.sm,
            color: colors.text,
            fontFamily: FontFamily,
            fontSize: 16,
          }}
        />

        <Pressable
          onPress={handleAdd}
          disabled={createTask.isPending || title.trim().length === 0}
          accessibilityRole="button"
          accessibilityLabel="Add task"
          accessibilityState={{ disabled: createTask.isPending || title.trim().length === 0 }}
          style={({ pressed }) => ({
            width: Layout.minTapTarget,
            height: Layout.minTapTarget,
            borderRadius: Radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: title.trim() ? colors.accentSoft : 'transparent',
            opacity: pressed ? 0.7 : 1,
          })}>
          {createTask.isPending ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <PlusIcon size={19} color={title.trim() ? colors.accent : colors.textTertiary} />
          )}
        </Pressable>
      </View>

      {error ? <FormMessage tone="error" message={error} /> : null}
    </View>
  );
}

/** Starting date for a task created from each view. */
export function defaultDueDateFor(view: TaskView): string | null {
  if (view === 'today') return todayString();
  if (view === 'upcoming') return toDateString(addDays(new Date(), 1));
  return null;
}
