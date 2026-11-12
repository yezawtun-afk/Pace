import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/** A single key (lowercase) mapped to the action it runs. */
export type ShortcutMap = Record<string, () => void>;

/**
 * True when the key press happened inside a text field, where `n` and `q` are
 * letters, not commands. Exported so the rule can be unit-tested without a DOM.
 */
export function isTypingTarget(tagName?: string | null, isContentEditable?: boolean): boolean {
  const tag = tagName?.toLowerCase();

  return tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(isContentEditable);
}

/**
 * Global keyboard shortcuts for the web. Native has no keyboard, so the hook
 * does nothing there.
 *
 * Keys are ignored while a field has focus and when a modifier is held, so
 * typing a note never opens a sheet. The action map is read through a ref, which
 * means callers can pass inline arrow functions without re-binding the listener
 * on every render.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true): void {
  const latest = useRef(shortcuts);

  useEffect(() => {
    latest.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;
    if (typeof window === 'undefined') return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const action = latest.current[event.key.toLowerCase()];
      if (!action) return;

      const target = event.target as HTMLElement | null;
      if (isTypingTarget(target?.tagName, target?.isContentEditable)) return;

      event.preventDefault();
      action();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
