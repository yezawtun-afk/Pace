import { wrapCardLine } from '../card-text';

describe('wrapCardLine', () => {
  it('returns nothing for an empty line', () => {
    expect(wrapCardLine('   ')).toEqual([]);
  });

  it('keeps a short line on one row', () => {
    expect(wrapCardLine('A quiet day, written down.')).toEqual(['A quiet day, written down.']);
  });

  it('breaks long text into rows no wider than the limit', () => {
    const text =
      'Today was slow in the morning but the afternoon went better than I expected, all things told.';
    const lines = wrapCardLine(text, 24, 3);

    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(24);
  });

  it('marks a line that had to be cut', () => {
    const text = Array.from({ length: 40 }, (_, index) => `word${index}`).join(' ');
    const lines = wrapCardLine(text, 20, 2);

    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
  });

  it('hard-cuts a single word wider than the limit', () => {
    expect(wrapCardLine('a'.repeat(60), 20, 2)[0]).toHaveLength(20);
  });
});
