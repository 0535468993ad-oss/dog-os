import { useState } from 'react';

import { useVolhardTest } from '../hooks/useVolhardTest';
import { VolhardPreconditionsGate } from './VolhardPreconditionsGate';
import { VolhardSummary } from './VolhardSummary';
import { VolhardTestStep } from './VolhardTestStep';

/** Tab 2: the gate, the ten field tests, then the profile. */
export function VolhardEvaluator() {
  const volhard = useVolhardTest();
  const [reviewing, setReviewing] = useState(false);

  if (!volhard.started || !volhard.test) {
    return <VolhardPreconditionsGate confirmed={volhard.confirmed} gateOpen={volhard.gateOpen} onToggle={volhard.togglePrecondition} onStart={volhard.start} />;
  }

  if (volhard.result && !reviewing) {
    return (
      <VolhardSummary
        result={volhard.result}
        onReview={() => {
          setReviewing(true);
          volhard.goTo(0);
        }}
        onReset={volhard.reset}
      />
    );
  }

  return (
    <VolhardTestStep
      test={volhard.test}
      index={volhard.index}
      total={volhard.total}
      selected={volhard.scores[volhard.test.id]}
      onScore={(score) => {
        volhard.score(score);
        // Re-scoring the last test returns to the profile.
        if (reviewing && volhard.index === volhard.total - 1) setReviewing(false);
      }}
      onBack={() => volhard.goTo(volhard.index - 1)}
    />
  );
}
