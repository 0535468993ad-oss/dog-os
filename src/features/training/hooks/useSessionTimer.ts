import { useEffect, useState } from 'react';

import { elapsedSeconds } from '@/features/gamification/utils/integrity';

/**
 * A live session timer. Time is measured from the start timestamp, not by counting ticks, so it stays
 * correct when the app is backgrounded; the interval only refreshes the display.
 */
export function useSessionTimer() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt === null) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return {
    startedAt,
    elapsed: startedAt === null ? 0 : elapsedSeconds(startedAt, now),
    start: () => {
      const at = Date.now();
      setStartedAt(at);
      setNow(at);
    },
    reset: () => setStartedAt(null),
  };
}
