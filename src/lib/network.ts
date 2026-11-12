/**
 * One connection watcher for the whole app.
 *
 * TanStack Query already listens to `navigator.onLine` on the web, but React
 * Native has no such event: without help `onlineManager.isOnline()` stays `true`
 * forever on a phone. NetInfo fills that gap, so the offline banner appears and
 * queued mutations replay as soon as the radio comes back.
 *
 * `startNetworkWatcher()` is idempotent — the root layout calls it once on mount,
 * and a second call is a no-op. The listener stays for the life of the process,
 * which is what we want: there is exactly one app and one network.
 */

import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { isOnlineNow } from '@/lib/network-state';

let started = false;

export function startNetworkWatcher(): void {
  // The web gets its events from the browser; nothing to add there.
  if (started || Platform.OS === 'web') return;
  started = true;

  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(isOnlineNow(state))),
  );
}
