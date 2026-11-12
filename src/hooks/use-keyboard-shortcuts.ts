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

/** The parts of a `keydown` event the shortcut rule needs. */
export type ShortcutEvent = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  defaultPrevented?: boolean;
  target?: { tagName?: string | null; isContentEditable?: boolean } | null;
};

/**
 * Decides what a key press means: the lowercase key to run, or `null` to ignore
 * it. Modifiers and text fields are filtered out here, in one pure function, so
 * the behaviour is testable and the listener below stays four lines long.
 *
 * Shift is allowed on purpose: a capital `N` still opens a new task, which is
 * what people actually press when their caps lock is on.
 */
export function shortcutKey(event: ShortcutEvent): string | null {
  if (event.defaultPrevented) return null;
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  if (!event.key) return null;

  const target = event.target;
  if (isTypingTarget(target?.tagName, target?.isContentEditable)) return null;

  return event.key.toLowerCase();
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
      const target = event.target as HTMLElement | null;
      const key = shortcutKey({
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        defaultPrevented: event.defaultPrevented,
        target: { tagName: target?.tagName, isContentEditable: target?.isContentEditable },
      });
      if (!key) return;

      const action = latest.current[key];
      if (!action) return;

      event.preventDefault();
      action();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
