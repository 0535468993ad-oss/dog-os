import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { isSchemaMissingError } from './supabaseErrors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Keep data for screens the user left for a day: going back to one offline still shows it.
      gcTime: 24 * 60 * 60 * 1000,
      // Always attempt the request, even when the device reports no connection: a failed refresh keeps the
      // cached data (screens show it with a notice), an empty cache gets the "no connection" message, and
      // nothing waits silently in a paused state. Reconnecting refetches stale queries (see onlineStatus.ts).
      networkMode: 'always',
      retry: (failureCount, error) => {
        // Don't retry auth/permission/validation errors or a missing table – they won't succeed on retry.
        if (isSchemaMissingError(error)) return false;
        const status = (error as { status?: number }).status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
    // Fail fast offline instead of pausing: a save button must not spin until the connection returns.
    mutations: { retry: false, networkMode: 'always' },
  },
});

// React Query refetches stale queries on window focus; on native, map that to the app returning to the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  });
}

export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  /** Prefix of every user's dogs list – for invalidation from features that don't hold the user id. */
  allDogs: ['dogs'] as const,
  dogs: (userId: string) => ['dogs', userId] as const,
  dogPhoto: (path: string) => ['dog-photo', path] as const,
  trainingCatalog: ['training-catalog'] as const,
  trainingProgress: (dogId: string) => ['training-progress', dogId] as const,
  /** On-device gamification state (XP, streak, trophies) for a dog. */
  trainingGame: (dogId: string) => ['training-game', dogId] as const,
  knowledgeBase: ['knowledge-base'] as const,
  knowledgeBookmarks: (userId: string) => ['knowledge-bookmarks', userId] as const,
  chat: (dogId: string | null) => ['chat', dogId ?? 'general'] as const,
  health: (dogId: string) => ['health', dogId] as const,
  vetKnowledge: ['vet-knowledge'] as const,
  journal: (dogId: string) => ['journal', dogId] as const,
  /** Prefix of every dog's cached AI insights. */
  allInsights: ['insights'] as const,
  insights: (dogId: string, date: string) => ['insights', dogId, date] as const,
  consents: (userId: string) => ['consents', userId] as const,
  supportRequests: (userId: string) => ['support-requests', userId] as const,
};
