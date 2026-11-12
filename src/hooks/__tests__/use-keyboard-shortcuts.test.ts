import { isTypingTarget } from '../use-keyboard-shortcuts';

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
