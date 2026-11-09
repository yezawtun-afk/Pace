/**
 * Re-exported so the whole app imports colour-scheme state from one place.
 *
 * The web build uses `output: "single"` (a client-rendered SPA), so there is no
 * server HTML to disagree with and the hook needs no mount-time workaround.
 */

export { useColorScheme } from 'react-native';
