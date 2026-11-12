import { isOnlineNow } from '../network-state';

describe('isOnlineNow', () => {
  it('is online when connected and reachable', () => {
    expect(isOnlineNow({ isConnected: true, isInternetReachable: true })).toBe(true);
  });

  it('is offline when the radio is down', () => {
    expect(isOnlineNow({ isConnected: false, isInternetReachable: null })).toBe(false);
  });

  it('is offline when connected to a network with no internet', () => {
    expect(isOnlineNow({ isConnected: true, isInternetReachable: false })).toBe(false);
  });

  it('stays optimistic while a value is still unknown', () => {
    expect(isOnlineNow({ isConnected: null, isInternetReachable: null })).toBe(true);
    expect(isOnlineNow({ isConnected: true, isInternetReachable: null })).toBe(true);
  });
});
