import { useMemo, useState } from 'react';

import { BREEDS_CATALOG } from '../data/breedsCatalog';
import { rankBreeds } from '../utils/matchAlgorithm';
import { EMPTY_DRAFT, isStepAnswered, QUIZ_STEP_COUNT, toProfile, type QuizDraft } from '../utils/quizDraft';

/** The six-step profiler: answers, step navigation, and the ranked breeds once it is finished. */
export function useLifestyleQuiz() {
  const [draft, setDraft] = useState<QuizDraft>(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);

  const profile = useMemo(() => (finished ? toProfile(draft) : null), [finished, draft]);
  const ranking = useMemo(() => (profile ? rankBreeds(profile, BREEDS_CATALOG) : null), [profile]);
  const canAdvance = isStepAnswered(step, draft);

  return {
    draft,
    step,
    stepCount: QUIZ_STEP_COUNT,
    canAdvance,
    ranking,
    /** Merges answers into the draft. */
    update: (patch: Partial<QuizDraft>) => setDraft((current) => ({ ...current, ...patch })),
    /** Next step, or the results after the last one. */
    next: () => {
      if (!canAdvance) return;
      if (step === QUIZ_STEP_COUNT - 1) setFinished(true);
      else setStep(step + 1);
    },
    back: () => setStep(Math.max(0, step - 1)),
    /** Back to the questions with the answers kept, to tweak one. */
    edit: () => setFinished(false),
    restart: () => {
      setDraft(EMPTY_DRAFT);
      setStep(0);
      setFinished(false);
    },
  };
}
