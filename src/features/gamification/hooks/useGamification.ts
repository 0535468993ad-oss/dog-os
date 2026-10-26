import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { showToast } from '@/components/ui';
import { queryKeys } from '@/lib/queryClient';
import { todayIso, toIsoDate } from '@/utils/date';
import { reportError } from '@/utils/errors';

import { loadSyncedGame, saveSyncedGame } from '../api/gameSync';
import { checkBadgeProgress, claimReward, type ClaimRefusal } from '../services/gamificationEngine';
import { settleLeague } from '../services/leagueEngine';
import { openLootBox } from '../services/lootBoxEngine';
import { applyStreakShields } from '../services/streakShield';
import type { StoredAssessment } from '@/features/training/types';

import type { BalancedAccess, CompletionInput, CompletionOutcome, GameEvent, GameState, LootReward, RepInput, RepOutcome, SessionTrack, StepCheckInput, StepOutcome } from '../types';
import { EMPTY_GAME_STATE } from '../utils/gameState';
import { checkStep, completeSession, isFrozen, logRep, logStruggle } from '../utils/integrity';
import { hapticCelebrate, hapticChecklistStep, hapticExerciseDone, hapticStep, hapticWarning } from './haptics';

/** What launch-time upkeep did: shield-covered days and a league move, for the banners. */
export interface UpkeepNotice {
  shieldDays: string[];
  league: { from: number; to: number } | null;
}

/**
 * Loads a dog's state and runs launch upkeep on it: shields cover missed days, a finished league week is
 * settled. A change is saved like any other, and what happened is left in the notice cache for the banners.
 */
async function loadWithUpkeep(client: QueryClient, dogId: string): Promise<GameState> {
  const today = todayIso();
  const loaded = await loadSyncedGame(dogId, today);
  const shielded = applyStreakShields(loaded, today);
  const settled = settleLeague(shielded.state, today);
  if (settled.state === loaded) return loaded;
  const next = { ...settled.state, updatedAt: Date.now() };
  saveSyncedGame(dogId, next, today)
    .then(({ uploaded }) => uploaded.catch(() => undefined))
    .catch((error: unknown) => reportError(error, 'gamification/upkeep'));
  const moved = settled.events.find((event) => event.type === 'LEAGUE_SETTLED');
  if (shielded.usedDays.length > 0 || moved) {
    const notice: UpkeepNotice = { shieldDays: shielded.usedDays, league: moved?.type === 'LEAGUE_SETTLED' ? { from: moved.from, to: moved.to } : null };
    client.setQueryData(queryKeys.trainingGameNotice(dogId), notice);
  }
  return next;
}

/** Level-ups and badge unlocks earn the success notification. */
const celebrates = (events: readonly GameEvent[]) => events.some((event) => event.type === 'LEVEL_UP' || event.type === 'BADGE_UNLOCKED');

/** The active dog's gamification state, with every scoring action routed through the integrity rules. */
export function useGamification(dogId: string | null) {
  const client = useQueryClient();
  const key = queryKeys.trainingGame(dogId ?? 'none');
  const query = useQuery({
    queryKey: key,
    queryFn: () => (dogId ? loadWithUpkeep(client, dogId) : Promise.resolve(EMPTY_GAME_STATE)),
    enabled: !!dogId,
    // Re-checks the server now and then, so progress from another device appears; the newer copy wins.
    staleTime: 5 * 60 * 1000,
  });
  const state = query.data ?? EMPTY_GAME_STATE;
  const noticeKey = queryKeys.trainingGameNotice(dogId ?? 'none');
  // Read-only view of the notice the upkeep left; it never fetches.
  const notice = useQuery<UpkeepNotice | null>({ queryKey: noticeKey, queryFn: () => null, enabled: false, initialData: null }).data;

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
    /** Stores a command's track; refused (false) for a balanced choice while the dog is under the age floor. */
    setTrack: (commandId: string, track: SessionTrack, access: BalancedAccess): boolean => {
      if (track === 'BALANCED' && access === 'LOCKED') return false;
      setPreferences({ trackByCommand: { ...current().preferences.trackByCommand, [commandId]: track } });
      return true;
    },
    /** Confirms the balanced safety rules at `rulesVersion` and each given warning at its current version. */
    acknowledgeBalanced: (rulesVersion: number, warnings: readonly { id: string; version: number }[]) =>
      setPreferences({
        balancedRulesAckVersion: rulesVersion,
        acknowledgedRisks: { ...current().preferences.acknowledgedRisks, ...Object.fromEntries(warnings.map((warning) => [warning.id, warning.version])) },
      }),
    /**
     * Saves a finished assessment (with the closest legacy trait, for older app versions). Resolves once it
     * is stored on the device and throws if that fails, so the caller can keep the owner on a retry; the
     * upload follows and retries on the next load, like every other change.
     */
    saveAssessment: async (assessment: StoredAssessment, temperament: string): Promise<void> => {
      if (!dogId) throw new Error('No dog to save the assessment for');
      const next: GameState = { ...current(), preferences: { ...current().preferences, assessment, temperament }, updatedAt: Date.now() };
      const { uploaded } = await saveSyncedGame(dogId, next, todayIso());
      client.setQueryData(key, next);
      uploaded.catch(() => undefined);
    },
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
    /** Logs a successful rep in the combo arena (light tap; a warning when refused as spam). */
    logRep: (input: Omit<RepInput, 'now'>, now = Date.now()): RepOutcome => {
      const outcome = logRep(current(), { ...input, now });
      if (outcome.state !== current()) commit(outcome.state);
      if (outcome.refused) hapticWarning();
      else hapticStep();
      return outcome;
    },
    /** "We're stuck": restarts the combo without touching the session timer. */
    logStruggle: (commandId: string, sessionStartedAt: number | null) => commit(logStruggle(current(), commandId, sessionStartedAt)),
    /** Opens a pending loot box; returns what it paid, or null when there is none. */
    openBox: (random: () => number = Math.random, now = Date.now()): LootReward | null => {
      const result = openLootBox(current(), random, now, toIsoDate(new Date(now)));
      if (!result.reward) return null;
      commit(result.state);
      return result.reward;
    },
    notice,
    dismissNotice: () => client.setQueryData(noticeKey, null),
    /** Confirms a session and returns what it earned (or why it was refused). */
    complete: (input: Omit<CompletionInput, 'now' | 'today' | 'hour'>, now = Date.now()): CompletionOutcome => {
      const at = new Date(now);
      const outcome = completeSession(current(), { ...input, now, today: toIsoDate(at), hour: at.getHours() });
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
