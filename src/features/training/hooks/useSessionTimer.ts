import { useEffect, useState } from 'react';

import { elapsedSeconds } from '@/features/gamification/utils/integrity';

/**
 * A live session timer. Time is measured from the start timestamp, not by counting ticks, so it stays
 * correct when the app is backgrounded; the interval only refreshes the display. `minSeconds` is the
 * anti-cheat lock – 180 for a session, 60 for the streak-rescue drill – and the scoring rules check it again.
 */
export function useSessionTimer(minSeconds: number) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt === null) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const elapsed = startedAt === null ? 0 : elapsedSeconds(startedAt, now);
  return {
    startedAt,
    elapsed,
    minSeconds,
    /** Seconds until the confirm button unlocks. */
    remaining: Math.max(0, minSeconds - elapsed),
    ready: startedAt !== null && elapsed >= minSeconds,
    start: () => {
      const at = Date.now();
      setStartedAt(at);
      setNow(at);
    },
    reset: () => setStartedAt(null),
  };
}
