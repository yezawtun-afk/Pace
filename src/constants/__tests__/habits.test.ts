import { DEFAULT_HABIT_ICON, HABIT_ICON_KEYS, habitIconKey, type HabitIconKey } from '../habits';

describe('habitIconKey', () => {
  it('accepts every key in the picker', () => {
    for (const key of HABIT_ICON_KEYS) {
      expect(habitIconKey(key)).toBe(key);
    }
  });

  it('turns the emoji stored by older rows into the matching glyph', () => {
    expect(habitIconKey('🌿')).toBe('leaf');
    expect(habitIconKey('🚶')).toBe('walk');
    expect(habitIconKey('📖')).toBe('book');
    expect(habitIconKey('🧺')).toBe('basket');
    expect(habitIconKey('🧠')).toBe('mind');
  });

  it('ignores the variation selector some keyboards add', () => {
    // Both the bare and the presentation-emoji form appear in real rows.
    expect(habitIconKey('☀')).toBe('sun');
    expect(habitIconKey('☀️')).toBe('sun');
  });

  it('falls back to nothing for missing or unknown values', () => {
    expect(habitIconKey(null)).toBeNull();
    expect(habitIconKey(undefined)).toBeNull();
    expect(habitIconKey('')).toBeNull();
    expect(habitIconKey('🦄')).toBeNull();
    expect(habitIconKey('Leaf')).toBeNull();
  });

  it('has a default that is a real key', () => {
    expect(HABIT_ICON_KEYS).toContain<HabitIconKey>(DEFAULT_HABIT_ICON);
  });
});
