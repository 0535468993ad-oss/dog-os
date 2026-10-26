import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { showToast } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useActiveDog, useProfile } from '@/features/dogs/hooks';
import { useGamification } from '@/features/gamification/hooks/useGamification';
import type { AssessmentKey, TrainingTrack } from '@/features/training/types';
import { signalsFromAnswers, traitForSignals } from '@/features/training/utils/assessmentProfile';
import { recommendFromAssessment } from '@/features/training/utils/temperamentEngine';
import type { ProfileRow } from '@/lib/database.types';
import { queryKeys } from '@/lib/queryClient';
import { ageInMonths } from '@/utils/date';
import { reportError } from '@/utils/errors';

import { setOnboardingCompleted } from '../api/onboardingApi';
import type { OnboardingMode, WizardState } from '../types';
import { chooseDog, completeAnswers, initialWizard, moveStep, onboardingRoute, patchAnswer, prefillFor, resetToDogStep } from '../utils/wizard';

/** Where the first-run guard sends the signed-in owner (loading, onboarding or the app). */
export function useOnboardingRoute() {
  const profile = useProfile();
  return onboardingRoute({ isLoading: profile.isLoading, isError: profile.isError, data: profile.data });
}

/** Marks first-run onboarding done. After a second failed save the app opens anyway for this session. */
export function useCompleteOnboarding() {
  const user = useUser();
  const client = useQueryClient();
  const [failures, setFailures] = useState(0);
  const key = queryKeys.profile(user.id);
  // The guard reads the cached profile, so flipping it opens the app without waiting for a refetch.
  const markDoneLocally = () => client.setQueryData<ProfileRow | null>(key, (old) => (old ? { ...old, onboarding_completed: true } : old));
  const mutation = useMutation({
    mutationFn: () => setOnboardingCompleted(user.id),
    onSuccess: () => {
      markDoneLocally();
      void client.invalidateQueries({ queryKey: key });
    },
    onError: (error: unknown) => {
      reportError(error, 'onboarding/complete');
      const count = failures + 1;
      setFailures(count);
      if (count >= 2) {
        markDoneLocally();
        showToast('לא הצלחנו לשמור את הסיום – נשאל שוב בכניסה הבאה.');
      } else {
        showToast('לא הצלחנו לשמור. נסו שוב.');
      }
    },
  });
  return { complete: () => mutation.mutate(), isPending: mutation.isPending };
}

export type SaveResult = 'SAVED' | 'NOT_READY' | 'DOG_MISSING' | 'SAVE_FAILED';

/** The assessment wizard for one dog: its state, the live recommendation and the save. */
export function useAssessmentWizard(mode: OnboardingMode, requestedDogId: string | null) {
  const { dogs, activeDog, isLoading: dogsLoading, refetch: refetchDogs } = useActiveDog();
  const [state, setState] = useState<WizardState>(() => initialWizard(mode, null));

  // A re-assessment binds once, during render, to the requested dog (checked against the owner's dogs),
  // else the active one; after that the binding never moves.
  if (mode === 'REASSESS' && state.assessedDogId === null && !dogsLoading) {
    const target = dogs.find((candidate) => candidate.id === requestedDogId) ?? activeDog;
    if (target) setState({ ...state, assessedDogId: target.id, answers: { ...prefillFor(target.birth_date), ...state.answers } });
  }

  const dog = dogs.find((candidate) => candidate.id === state.assessedDogId) ?? null;
  const game = useGamification(dog?.id ?? null);
  const answers = completeAnswers(state.answers);
  const birthAge = dog?.birth_date ? ageInMonths(dog.birth_date) : null;
  const recommendation = answers && dog ? recommendFromAssessment(answers, birthAge, dog.breed_id) : null;
  // Saving before the dog's progress has loaded would overwrite it with an empty state.
  const gameReady = dog !== null && !game.isLoading && !game.error;

  return {
    state,
    dogs,
    activeDog,
    dog,
    dogsLoading,
    recommendation,
    gameReady,
    gameError: game.error,
    retryGame: game.refetch,
    next: () => setState((current) => moveStep(current, mode, 1)),
    back: () => setState((current) => moveStep(current, mode, -1)),
    pickDog: (dogId: string) => {
      const picked = dogs.find((candidate) => candidate.id === dogId);
      setState((current) => chooseDog(current, picked ? picked.id : null, prefillFor(picked?.birth_date ?? null)));
    },
    answer: (key: AssessmentKey, raw: string | readonly string[]) => setState((current) => ({ ...current, answers: patchAnswer(current.answers, key, raw) })),
    /** Saves the assessment with the owner's chosen track; SAVED only once it is stored on the device. */
    save: async (selectedTrack: TrainingTrack): Promise<SaveResult> => {
      if (!dog || !answers || !recommendation) {
        setState(resetToDogStep);
        return 'DOG_MISSING';
      }
      if (!gameReady) return 'NOT_READY';
      // The dog may have been deleted on another device. Offline the check is skipped: the save is
      // device-first and uploads later.
      const [fresh] = await refetchDogs().catch(() => [undefined]);
      if (fresh && !fresh.isError && fresh.data && !fresh.data.some((candidate) => candidate.id === dog.id)) {
        setState(resetToDogStep);
        return 'DOG_MISSING';
      }
      // The age floor holds here too: a locked dog never stores a balanced choice, even one picked before
      // the dog's birth date changed while the card was open.
      const track: TrainingTrack = recommendation.gate === 'LOCKED' ? 'FORCE_FREE' : selectedTrack;
      const assessment = { answers, completedAt: new Date().toISOString(), selectedTrack: track, ownerOverrodeTrack: track !== recommendation.track };
      try {
        await game.saveAssessment(assessment, traitForSignals(signalsFromAnswers(answers, birthAge)));
        return 'SAVED';
      } catch (error) {
        reportError(error, 'onboarding/saveAssessment');
        return 'SAVE_FAILED';
      }
    },
  };
}
