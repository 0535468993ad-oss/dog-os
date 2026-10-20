import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/**
 * Native: tells React Query when the device goes offline and back online, so stale data refetches the
 * moment the connection returns. (Web already gets this from the browser's online/offline events.)
 */
export function configureOnlineManager(): void {
  if (Platform.OS === 'web') return;
  // isConnected is null while unknown – treat that as online rather than blocking the first fetch.
  onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)));
}

/** Whether the device currently has a connection, as React Query sees it. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
    () => true,
  );
}
