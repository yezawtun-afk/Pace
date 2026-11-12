import { isTypingTarget, shortcutKey } from '../use-keyboard-shortcuts';

describe('isTypingTarget', () => {
  it('ignores keys typed into form fields', () => {
    expect(isTypingTarget('INPUT')).toBe(true);
    expect(isTypingTarget('textarea')).toBe(true);
    expect(isTypingTarget('Select')).toBe(true);
  });

  it('ignores contenteditable regions', () => {
    expect(isTypingTarget('DIV', true)).toBe(true);
  });

  it('lets shortcuts fire on ordinary elements', () => {
    expect(isTypingTarget('DIV')).toBe(false);
    expect(isTypingTarget('BUTTON')).toBe(false);
    expect(isTypingTarget(undefined)).toBe(false);
    expect(isTypingTarget(null, false)).toBe(false);
  });
});

describe('shortcutKey', () => {
  it('returns the lowercase key for a plain press', () => {
    expect(shortcutKey({ key: 'n' })).toBe('n');
    expect(shortcutKey({ key: 'Q' })).toBe('q');
  });

  it('ignores presses with a command modifier', () => {
    expect(shortcutKey({ key: 'n', metaKey: true })).toBeNull();
    expect(shortcutKey({ key: 'n', ctrlKey: true })).toBeNull();
    expect(shortcutKey({ key: 'n', altKey: true })).toBeNull();
  });

  it('still fires with shift held, so caps lock is harmless', () => {
    expect(shortcutKey({ key: 'N', shiftKey: true })).toBe('n');
  });

  it('ignores keys already handled by someone else', () => {
    expect(shortcutKey({ key: 'n', defaultPrevented: true })).toBeNull();
  });

  it('ignores keys typed into a field', () => {
    expect(shortcutKey({ key: 'n', target: { tagName: 'INPUT' } })).toBeNull();
    expect(
      shortcutKey({ key: 'q', target: { tagName: 'DIV', isContentEditable: true } }),
    ).toBeNull();
  });

  it('fires on a button or the page body', () => {
    expect(shortcutKey({ key: 'n', target: { tagName: 'BUTTON' } })).toBe('n');
    expect(shortcutKey({ key: 'q', target: null })).toBe('q');
  });

  it('ignores keys it cannot read', () => {
    expect(shortcutKey({ key: '' })).toBeNull();
  });
});
