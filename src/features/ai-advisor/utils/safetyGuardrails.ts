// Deterministic emergency interceptor for the AI advisor. It runs on-device before a message reaches the
// model: when a message mentions a toxin, a snake bite or bloat, the app shows fixed, reviewed first-aid
// steps at once instead of waiting for (or trusting) a generated answer.
import type { EmergencyAlert, GuardrailResult } from '../types';
import { BLOAT_ALIASES, CHAT_TOXINS, EMERGENCY_COPY, SNAKEBITE_ALIASES, TOXIN_ACTIONS_HE } from './emergencyCatalog';
import { mentionsAny } from './freeTextMatcher';

export { EMERGENCY_CONTACTS_HE } from './emergencyCatalog';

/** Every emergency the message mentions, most time-critical first; `clear` when there is none. */
export function checkEmergency(message: string): GuardrailResult {
  const alerts: EmergencyAlert[] = [];
  if (mentionsAny(message, BLOAT_ALIASES)) alerts.push({ kind: 'BLOAT', ...EMERGENCY_COPY.BLOAT });
  if (mentionsAny(message, SNAKEBITE_ALIASES)) alerts.push({ kind: 'SNAKEBITE', ...EMERGENCY_COPY.SNAKEBITE });
  for (const toxin of CHAT_TOXINS) {
    if (mentionsAny(message, toxin.aliases)) alerts.push({ kind: 'TOXIN', titleHe: toxin.nameHe, whyHe: toxin.dangerHe, ...TOXIN_ACTIONS_HE });
  }
  return alerts.length > 0 ? { level: 'critical', alerts } : { level: 'clear' };
}
