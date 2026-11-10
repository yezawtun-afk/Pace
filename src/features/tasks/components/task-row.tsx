import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { Dot } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';
import { shortTime } from '@/lib/time';
import { useTheme } from '@/lib/use-theme';
import type { Category, Task } from '@/types/database';

import { dueLabel, isOverdue } from '../grouping';

type TaskRowProps = {
  task: Task;
  category?: Category;
  onToggle: () => void;
  onOpen: () => void;
  /** Removes the divider under the last row of a card. */
  last?: boolean;
};

/**
 * One task: a checkbox, the title, and a quiet meta line (due, time, category).
 * Tapping the row opens the editor; tapping the box checks it off.
 */
export function TaskRow({ task, category, onToggle, onOpen, last = false }: TaskRowProps) {
  const { colors } = useTheme();

  const overdue = isOverdue(task) && !task.completed;
  const due = dueLabel(task);
  const time = task.due_time ? shortTime(task.due_time) : null;

  // The whole row reads as one sentence for screen readers, so the coloured dot
  // and the small separators never carry meaning on their own.
  const spoken = [
    task.title,
    task.completed ? 'completed' : null,
    due,
    time ? `at ${time}` : null,
    category?.name,
    task.priority < 4 ? `priority ${task.priority}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: Space.xs,
        paddingRight: Space.md,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}>
      <Checkbox
        checked={task.completed}
        onPress={onToggle}
        label={task.completed ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
      />

      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${spoken}`}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.sm,
          minHeight: 52,
          paddingVertical: Space.sm + 2,
          opacity: pressed ? 0.65 : 1,
        })}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText
            variant="body"
            tone={task.completed ? 'tertiary' : 'default'}
            numberOfLines={2}
            style={task.completed ? { textDecorationLine: 'line-through' } : undefined}>
            {task.title}
          </AppText>

          {due || time || category ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: Space.sm - 2,
              }}>
              {due ? (
                <AppText variant="caption" tone={overdue ? 'danger' : 'tertiary'}>
                  {due}
                </AppText>
              ) : null}

              {due && time ? <Separator /> : null}
              {time ? (
                <AppText variant="caption" tone="tertiary">
                  {time}
                </AppText>
              ) : null}

              {category ? (
                <>
                  {due || time ? <Separator /> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.xs + 1 }}>
                    <Dot color={category.color} />
                    <AppText variant="caption" tone="tertiary">
                      {category.name}
                    </AppText>
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
        </View>

        {task.priority < 4 ? (
          <View accessibilityElementsHidden importantForAccessibility="no">
            <Dot color={colors.priority[task.priority as 1 | 2 | 3 | 4]} size={7} />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function Separator() {
  return (
    <AppText variant="caption" tone="tertiary">
      ·
    </AppText>
  );
}
