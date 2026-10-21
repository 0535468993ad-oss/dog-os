import { useCallback, useState } from 'react';

import type { EmergencyAlert } from '../types';
import { checkEmergency } from '../utils/safetyGuardrails';

interface Intercepted {
  message: string;
  alerts: readonly EmergencyAlert[];
}

/**
 * Holds a message the guardrail stopped. `intercept` returns true when the message is an emergency (show
 * the card, don't send); `release` clears it and hands the message back, for "send to the advisor anyway".
 */
export function useEmergencyIntercept() {
  const [held, setHeld] = useState<Intercepted | null>(null);

  const intercept = useCallback((message: string): boolean => {
    const result = checkEmergency(message);
    if (result.level === 'clear') return false;
    setHeld({ message, alerts: result.alerts });
    return true;
  }, []);

  const release = useCallback((): string | null => {
    const message = held?.message ?? null;
    setHeld(null);
    return message;
  }, [held]);

  return { alerts: held?.alerts ?? null, intercept, release };
}
