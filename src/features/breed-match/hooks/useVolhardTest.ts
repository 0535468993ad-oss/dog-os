import { useMemo, useState } from 'react';

import { VOLHARD_TESTS } from '../data/volhardProfiles';
import type { PreconditionId, VolhardScore, VolhardScores } from '../types';
import { evaluateVolhard, isComplete, preconditionsMet } from '../utils/volhardEvaluator';
import { toggleId } from '../utils/adultAssessment';

/** One puppy's Volhard session: the pre-condition gate, the ten scored tests and the profile. */
export function useVolhardTest() {
  const [confirmed, setConfirmed] = useState<PreconditionId[]>([]);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<VolhardScores>({});

  const complete = isComplete(scores);
  const result = useMemo(() => (complete ? evaluateVolhard(scores) : null), [complete, scores]);
  const test = VOLHARD_TESTS[index] ?? VOLHARD_TESTS[0];

  return {
    confirmed,
    gateOpen: preconditionsMet(confirmed),
    started,
    index,
    total: VOLHARD_TESTS.length,
    test,
    scores,
    result,
    togglePrecondition: (id: PreconditionId) => setConfirmed((current) => toggleId(current, id) as PreconditionId[]),
    start: () => {
      if (preconditionsMet(confirmed)) setStarted(true);
    },
    /** Scores the current test and moves on to the next one. */
    score: (value: VolhardScore) => {
      if (!test) return;
      setScores((current) => ({ ...current, [test.id]: value }));
      setIndex((current) => Math.min(VOLHARD_TESTS.length - 1, current + 1));
    },
    goTo: (next: number) => setIndex(Math.max(0, Math.min(VOLHARD_TESTS.length - 1, next))),
    reset: () => {
      setScores({});
      setIndex(0);
      setStarted(false);
      setConfirmed([]);
    },
  };
}
