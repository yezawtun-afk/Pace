/**
 * The one decision the offline watcher makes, kept apart from NetInfo so it can
 * be tested in Jest without loading a native module.
 */

/** The NetInfo fields the app actually reads. */
export type ConnectionState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

/**
 * `isConnected` is `null` until the first event and `isInternetReachable` stays
 * `null` on platforms without a reachability probe, so only an explicit `false`
 * counts as offline. Being briefly optimistic is better than showing an offline
 * banner to someone who is online.
 */
export function isOnlineNow(state: ConnectionState): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}
