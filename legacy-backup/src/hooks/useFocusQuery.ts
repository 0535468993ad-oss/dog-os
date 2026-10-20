import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

export type QueryState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

export type FocusQuery<T> = QueryState<T> & { refetch: () => Promise<void> };

// Remembers which fetcher produced the result, so switching fetchers (e.g. another dog) never
// shows the previous fetcher's data while the new one loads.
type InternalState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; source: () => Promise<T> }
  | { status: 'success'; data: T; source: () => Promise<T> };

const LOAD_ERROR = "Couldn't load your data. Check your connection and try again.";

// Loads on every focus, so changes made on another tab show up when you come back.
// `fetcher` must be stable (module-level or useCallback); a new identity triggers a reload.
export function useFocusQuery<T>(fetcher: () => Promise<T>): FocusQuery<T> {
  const [state, setState] = useState<InternalState<T>>({ status: 'loading' });
  const latestRequest = useRef(0);

  const refetch = useCallback(async () => {
    const requestId = ++latestRequest.current;
    try {
      const data = await fetcher();
      if (requestId === latestRequest.current) setState({ status: 'success', data, source: fetcher });
    } catch (error) {
      if (__DEV__) console.warn('[useFocusQuery]', error);
      if (requestId === latestRequest.current) {
        setState({ status: 'error', message: LOAD_ERROR, source: fetcher });
      }
    }
  }, [fetcher]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  if (state.status === 'loading' || state.source !== fetcher) {
    return { status: 'loading', refetch };
  }
  return state.status === 'success'
    ? { status: 'success', data: state.data, refetch }
    : { status: 'error', message: state.message, refetch };
}
