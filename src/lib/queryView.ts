/**
 * What a screen shows for a query result:
 * - 'failed': nothing cached and the fetch failed – a full-page error with retry;
 * - 'stale': cached data, but the latest refresh failed – the data, plus a small notice;
 * - 'fresh': the data as is.
 * A failed background refresh must never hide data the user already has (e.g. when the device goes offline).
 */
export type CacheState = 'fresh' | 'stale' | 'failed';

export function cacheState(error: unknown, hasData: boolean): CacheState {
  if (!error) return 'fresh';
  return hasData ? 'stale' : 'failed';
}
