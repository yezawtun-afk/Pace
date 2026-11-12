/**
 * Habit suggestions offered during onboarding.
 *
 * Picked to cover the most common "small daily thing" people want to keep:
 * movement, quiet, reading, sleep, water, and tidying. Each one starts as a
 * plain daily habit — the user can change the schedule later in Habits.
 *
 * The colours are mid-tone on purpose: they sit on both the light and the dark
 * surface without becoming hard to read.
 */

import type { HabitIconKey } from './habits';

export type StarterHabit = {
  /** Stable id used for React keys and for the selected set. */
  id: string;
  name: string;
  /** One of `HABIT_ICON_KEYS`; drawn as a line glyph everywhere. */
  icon: HabitIconKey;
  color: string;
  /** One line explaining the habit, shown under the name. */
  hint: string;
};

export const STARTER_HABITS: StarterHabit[] = [
  {
    id: 'move',
    name: 'Move for 20 minutes',
    icon: 'walk',
    color: '#4F7A5B',
    hint: 'A walk, a stretch, anything that gets you out of the chair.',
  },
  {
    id: 'quiet',
    name: 'Sit quietly',
    icon: 'still',
    color: '#5C7A8A',
    hint: 'Five minutes of nothing. No phone, no input.',
  },
  {
    id: 'read',
    name: 'Read 10 pages',
    icon: 'book',
    color: '#8A6A4F',
    hint: 'A book, not a feed.',
  },
  {
    id: 'sleep',
    name: 'Lights out by 23:00',
    icon: 'rest',
    color: '#5E5C8A',
    hint: 'The habit almost every other habit depends on.',
  },
  {
    id: 'water',
    name: 'Drink more water',
    icon: 'drop',
    color: '#4F7A8A',
    hint: 'Keep a glass where you can see it.',
  },
  {
    id: 'tidy',
    name: 'Tidy for 10 minutes',
    icon: 'basket',
    color: '#8A7A4F',
    hint: 'One surface, one drawer, one small corner.',
  },
];

/** How many habits onboarding asks the user to pick. */
export const STARTER_HABIT_MIN = 1;
export const STARTER_HABIT_MAX = 3;
