/**
 * Choices offered when creating a habit.
 *
 * The colours are mid-tone: they stay readable as a badge on both the light and
 * the dark surface, and they never carry meaning on their own (the name is
 * always next to them).
 */

export const HABIT_COLORS = [
  '#4F7A5B',
  '#5C7A8A',
  '#8A6A4F',
  '#5E5C8A',
  '#4F7A8A',
  '#8A7A4F',
  '#A0554F',
  '#4F8A6F',
] as const;

/**
 * The icons a habit can pick, in the order the editor shows them. These keys are
 * stored verbatim in `habits.icon`; `HabitGlyph` draws them (see
 * `src/components/ui/icons.tsx`). Keep the names stable.
 */
export const HABIT_ICON_KEYS = [
  'leaf',
  'walk',
  'book',
  'moon',
  'drop',
  'basket',
  'still',
  'run',
  'music',
  'pen',
  'apple',
  'sun',
  'bike',
  'broom',
  'rest',
  'mind',
] as const;

export type HabitIconKey = (typeof HABIT_ICON_KEYS)[number];

export const DEFAULT_HABIT_ICON: HabitIconKey = 'leaf';

/**
 * Habits created before the SVG set stored an emoji. Rather than rewrite rows in
 * the database, we read the emoji and show the matching glyph; saving the habit
 * once upgrades it to a key.
 */
const LEGACY_EMOJI_ICONS: Record<string, HabitIconKey> = {
  '🌿': 'leaf',
  '🚶': 'walk',
  '📖': 'book',
  '🌙': 'moon',
  '💧': 'drop',
  '🧺': 'basket',
  '🧘': 'still',
  '🏃': 'run',
  '🎸': 'music',
  '✍️': 'pen',
  '✍': 'pen',
  '🍎': 'apple',
  '☀️': 'sun',
  '☀': 'sun',
  '🚴': 'bike',
  '🧹': 'broom',
  '💤': 'rest',
  '🧠': 'mind',
};

/** Reads any stored icon value: a key, a legacy emoji, or nothing. */
export function habitIconKey(icon: string | null | undefined): HabitIconKey | null {
  if (!icon) return null;
  if ((HABIT_ICON_KEYS as readonly string[]).includes(icon)) return icon as HabitIconKey;
  return LEGACY_EMOJI_ICONS[icon] ?? null;
}
