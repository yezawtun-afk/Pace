import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { FontSerif, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/lib/use-theme';
import type { JournalEntry } from '@/types/database';

import { entryPreview, moodEmoji, wordCount } from '../journal';

type EntryCardProps = {
  entry: JournalEntry;
  tagNames: string[];
  onOpen: () => void;
};

/** "Today", "Yesterday", or "Tuesday 10 November". */
export function entryDateLabel(entryDate: string): string {
  const date = parseISO(entryDate);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE d MMMM');
}

/** One day in the history: date, mood, title or opening lines, tags. */
export function EntryCard({ entry, tagNames, onOpen }: EntryCardProps) {
  const { colors } = useTheme();
  const emoji = moodEmoji(entry.mood);
  const preview = entryPreview(entry.body, 160);
  const words = wordCount(entry.body);

  return (
    <Card padded={false}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${entryDateLabel(entry.entry_date)}${
          entry.title ? `, ${entry.title}` : ''
        }. Open entry.`}
        style={({ pressed }) => ({
          padding: Space.xl,
          gap: Space.sm,
          opacity: pressed ? 0.7 : 1,
        })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
          <AppText variant="smallStrong" style={{ flex: 1 }}>
            {entryDateLabel(entry.entry_date)}
          </AppText>

          {emoji ? (
            <AppText style={{ fontSize: 18 }} accessibilityLabel={`Mood: ${entry.mood} of 5`}>
              {emoji}
            </AppText>
          ) : null}
        </View>

        {entry.title ? (
          <AppText variant="bodyStrong" numberOfLines={2} style={{ fontFamily: FontSerif }}>
            {entry.title}
          </AppText>
        ) : null}

        {preview ? (
          <AppText
            variant="small"
            tone="secondary"
            numberOfLines={3}
            style={{ fontFamily: FontSerif }}>
            {preview}
          </AppText>
        ) : (
          <AppText variant="small" tone="tertiary">
            No words yet — just a mood.
          </AppText>
        )}

        {tagNames.length > 0 || words > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: Space.sm,
              marginTop: Space.xxs,
            }}>
            {tagNames.map((name) => (
              <View
                key={name}
                style={{
                  paddingHorizontal: Space.sm,
                  paddingVertical: 1,
                  borderRadius: Radius.pill,
                  backgroundColor: colors.surfaceMuted,
                }}>
                <AppText variant="caption" tone="tertiary">
                  {name}
                </AppText>
              </View>
            ))}

            {words > 0 ? (
              <AppText variant="caption" tone="tertiary">
                {words === 1 ? '1 word' : `${words} words`}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </Card>
  );
}
