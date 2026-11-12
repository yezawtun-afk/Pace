import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * True when the person has asked their device to reduce motion.
 *
 * On the web this reads the `prefers-reduced-motion` media query (the same one
 * `src/global.css` uses). On native it asks `AccessibilityInfo`, and keeps
 * listening because the setting can change while the app is open.
 *
 * Screens use it to skip entrance fades and looping pulses. Haptics are not
 * motion, so they are unaffected.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readInitialValue);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);

      // Older Safari only has the deprecated listener methods.
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
      }
      query.addListener(onChange);
      return () => query.removeListener(onChange);
    }

    let active = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

/** Reads the setting once so the first render is already correct. */
function readInitialValue(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
