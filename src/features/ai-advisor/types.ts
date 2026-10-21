/** What kind of emergency a chat message describes. */
export type EmergencyKind = 'TOXIN' | 'SNAKEBITE' | 'BLOAT';

/** One emergency the guardrail recognized, with the fixed, reviewed instructions shown for it. */
export interface EmergencyAlert {
  kind: EmergencyKind;
  /** What was recognized, e.g. "שוקולד" or "הכשת נחש". */
  titleHe: string;
  /** Why it is dangerous, in one or two sentences. */
  whyHe: string;
  /** What to do right now, in order. */
  actionsHe: readonly string[];
  /** What not to do. */
  avoidHe: readonly string[];
}

/** The guardrail's verdict: `critical` messages get the emergency card instead of an AI answer. */
export type GuardrailResult = { level: 'critical'; alerts: readonly EmergencyAlert[] } | { level: 'clear' };
