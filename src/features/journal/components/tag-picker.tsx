import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Chip, ChipRow } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { FontFamily, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';
import type { Tag } from '@/types/database';

type TagPickerProps = {
  /** Every tag this account has, alphabetically. */
  tags: Tag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
  onCreate: (name: string) => void;
  creating?: boolean;
  error?: string | null;
};

/**
 * Pick from existing tags or type a new one. Tags are shared across the whole
 * journal, so "work" means the same thing in every entry.
 */
export function TagPicker({
  tags,
  selectedIds,
  onToggle,
  onCreate,
  creating = false,
  error,
}: TagPickerProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName('');
  }

  return (
    <View style={{ gap: Space.md }}>
      {tags.length > 0 ? (
        <ChipRow>
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              selected={selectedIds.includes(tag.id)}
              onPress={() => onToggle(tag.id)}
              accessibilityLabel={`Tag ${tag.name}`}
            />
          ))}
        </ChipRow>
      ) : (
        <AppText variant="caption" tone="tertiary">
          No tags yet. Add one below — “work”, “rest”, “family”.
        </AppText>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: Radius.md,
            paddingHorizontal: Space.md,
            backgroundColor: colors.surface,
          }}>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={submit}
            placeholder="New tag"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            accessibilityLabel="New tag name"
            style={{
              flex: 1,
              minHeight: 44,
              color: colors.text,
              fontFamily: FontFamily,
              fontSize: 16,
            }}
          />
        </View>

        <Chip
          label="Add"
          onPress={submit}
          disabled={!name.trim() || creating}
          accessibilityLabel="Add tag"
        />
      </View>

      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
