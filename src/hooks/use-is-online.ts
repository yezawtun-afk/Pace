import { useSyncExternalStore } from 'react';

import { onlineManager } from '@tanstack/react-query';

/**
 * Tracks whether the device currently has a network connection.
 *
 * On the web this follows `navigator.onLine`; on native it defaults to "online"
 * unless a connectivity library is wired in (see `onlineManager.setEventListener`).
 * Mutations are still queued and retried by TanStack Query when a request fails.
 */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
    () => true,
  );
}
