import { useQuery, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/components/ui';
import { queryKeys } from '@/lib/queryClient';
import { todayIso, toIsoDate } from '@/utils/date';
import { reportError } from '@/utils/errors';

import { loadSyncedGame, saveSyncedGame } from '../api/gameSync';
import { checkBadgeProgress, claimReward, type ClaimRefusal } from '../services/gamificationEngine';
import type { CompletionInput, CompletionOutcome, GameEvent, GameState, SessionTrack, StepCheckInput, StepOutcome } from '../types';
import { EMPTY_GAME_STATE } from '../utils/gameState';
import { checkStep, completeSession, isFrozen } from '../utils/integrity';
import { hapticCelebrate, hapticChecklistStep, hapticExerciseDone, hapticStep, hapticWarning } from './haptics';

/** Level-ups and badge unlocks earn the success notification. */
const celebrates = (events: readonly GameEvent[]) => events.some((event) => event.type === 'LEVEL_UP' || event.type === 'BADGE_UNLOCKED');

/** The active dog's gamification state, with every scoring action routed through the integrity rules. */
export function useGamification(dogId: string | null) {
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
        reportError(error, 'gamification/cacheGame');
        showToast('לא הצלחנו לשמור את ההתקדמות במכשיר. נסו שוב.');
      });
  };

  /** Updates the training preferences that travel with the dog's progress. */
  const setPreferences = (patch: Partial<GameState['preferences']>) => commit({ ...current(), preferences: { ...current().preferences, ...patch } });

  return {
    state,
    /** Loading failed with no cached copy: scoring must wait, or an empty state would overwrite the server's. */
    error: query.error,
    refetch: () => void query.refetch(),
    isLoading: query.isLoading,
    isFrozen: (now: number) => isFrozen(current(), now),
    setTemperament: (temperament: string) => setPreferences({ temperament }),
    setTrack: (commandId: string, track: SessionTrack) => setPreferences({ trackByCommand: { ...current().preferences.trackByCommand, [commandId]: track } }),
    acknowledgeBalanced: () => setPreferences({ balancedAcknowledged: true }),
    /** A step ticked in a command's checklist: a light tap, no score. */
    checklistStep: () => hapticChecklistStep(),
    /** Ticks a protocol step inside a live session, banking its XP for the session's confirmation. */
    checkStep: (input: Omit<StepCheckInput, 'now'>, now = Date.now()): StepOutcome => {
      const outcome = checkStep(current(), { ...input, now });
      if (outcome.state !== current()) commit(outcome.state);
      if (outcome.refused === 'RAPID_ACTIONS' || outcome.refused === 'FROZEN') hapticWarning();
      else if (outcome.refused) hapticChecklistStep();
      else hapticStep();
      return outcome;
    },
    /** Confirms a session and returns what it earned (or why it was refused). */
    complete: (input: Omit<CompletionInput, 'now' | 'today'>, now = Date.now()): CompletionOutcome => {
      const outcome = completeSession(current(), { ...input, now, today: toIsoDate(new Date(now)) });
      commit(outcome.state);
      if (outcome.blocked) {
        hapticWarning();
      } else {
        hapticExerciseDone();
        if (celebrates(outcome.events)) hapticCelebrate();
      }
      return outcome;
    },
    /** The owner reviewed the toxic-foods list (part of the toxin_shield badge). */
    recordToxinReview: (now = Date.now()): GameEvent[] => {
      const result = checkBadgeProgress(current(), { type: 'TOXIN_REVIEWED' }, now);
      commit(result.state);
      if (celebrates(result.events)) hapticCelebrate();
      return result.events;
    },
    /** Claims a level reward; returns why it was refused, if it was. */
    claim: (rewardId: string): ClaimRefusal | undefined => {
      const result = claimReward(current(), rewardId);
      if (result.refused) return result.refused;
      commit(result.state);
      hapticCelebrate();
      return undefined;
    },
  };
}
