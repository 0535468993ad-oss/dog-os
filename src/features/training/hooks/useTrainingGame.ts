import { useQuery, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/components/ui';
import { queryKeys } from '@/lib/queryClient';
import { todayIso, toIsoDate } from '@/utils/date';
import { reportError } from '@/utils/errors';

import { loadSyncedGame, saveSyncedGame } from '../api/gameSync';
import type { CompletionInput, CompletionOutcome, GameState, MasterCommandId, TemperamentTrait, TrainingTrack } from '../types';
import { EMPTY_GAME_STATE } from '../utils/gameState';
import { completeSession, isFrozen, registerAction } from '../utils/integrity';
import { hapticCelebrate, hapticExerciseDone, hapticStep, hapticWarning } from './haptics';

/** The active dog's gamification state, with every scoring action routed through the integrity rules. */
export function useTrainingGame(dogId: string | null) {
  const client = useQueryClient();
  const key = queryKeys.trainingGame(dogId ?? 'none');
  const query = useQuery({
    queryKey: key,
    queryFn: () => (dogId ? loadSyncedGame(dogId, todayIso()) : Promise.resolve(EMPTY_GAME_STATE)),
    enabled: !!dogId,
    // Re-checks the server now and then, so progress from another device appears; the newer copy wins.
    staleTime: 5 * 60 * 1000,
  });
  const state = query.data ?? EMPTY_GAME_STATE;

  /** The latest state, even between renders (rapid presses must see each other). */
  const current = () => client.getQueryData<GameState>(key) ?? state;

  /** Applies a new state immediately, caches it and uploads it. Upload failures retry on the next load. */
  const commit = (changed: GameState) => {
    const next = { ...changed, updatedAt: Date.now() };
    client.setQueryData(key, next);
    if (!dogId) return;
    saveSyncedGame(dogId, next, todayIso())
      // The upload reports its own failures; the cached copy is newer and is pushed on the next load.
      .then(({ uploaded }) => uploaded.catch(() => undefined))
      .catch((error: unknown) => {
        reportError(error, 'training/cacheGame');
        showToast('לא הצלחנו לשמור את ההתקדמות במכשיר. נסו שוב.');
      });
  };

  return {
    state,
    /** Loading failed with no cached copy: scoring must wait, or an empty state would overwrite the server's. */
    error: query.error,
    refetch: () => void query.refetch(),
    isLoading: query.isLoading,
    isFrozen: (now: number) => isFrozen(current(), now),
    setTemperament: (temperament: TemperamentTrait) => commit({ ...current(), temperament }),
    setTrack: (commandId: MasterCommandId, track: TrainingTrack) => commit({ ...current(), trackByCommand: { ...current().trackByCommand, [commandId]: track } }),
    acknowledgeBalanced: () => commit({ ...current(), balancedAcknowledged: true }),
    /** Marks a step inside a live session; returns false when the rapid-action defence tripped. */
    markStep: (now = Date.now()): boolean => {
      const result = registerAction(current(), now);
      commit(result.state);
      if (result.tripped) hapticWarning();
      else hapticStep();
      return !result.tripped;
    },
    /** Confirms a session and returns what it earned (or why it was refused). */
    complete: (input: Omit<CompletionInput, 'now' | 'today'>, now = Date.now()): CompletionOutcome => {
      const outcome = completeSession(current(), { ...input, now, today: toIsoDate(new Date(now)) });
      commit(outcome.state);
      if (outcome.blocked) {
        hapticWarning();
      } else {
        hapticExerciseDone();
        if (outcome.levelAfter > outcome.levelBefore || outcome.newTrophies.length > 0) hapticCelebrate();
      }
      return outcome;
    },
  };
}
