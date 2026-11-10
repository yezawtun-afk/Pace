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

/** Emoji instead of icons: one tap, no picker library, readable everywhere. */
export const HABIT_ICONS = [
  '🌿',
  '🚶',
  '📖',
  '🌙',
  '💧',
  '🧺',
  '🧘',
  '🏃',
  '🎸',
  '✍️',
  '🍎',
  '☀️',
  '🚴',
  '🧹',
  '💤',
  '🧠',
] as const;
