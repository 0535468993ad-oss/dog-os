import { checkEmergency } from '@/features/ai-advisor/utils/safetyGuardrails';
import { comboTierIndex } from '@/features/gamification/utils/combo';

import { DEFAULT_PERSONA, PERSONAS } from '../data/personasData';
import type { PersonaContextVars, PersonaCopyKey, PersonaId } from '../types';

// Persona copy: interpolation, the escalating praise, and the safety invariant – an emergency always
// speaks as CLINICAL_PRO, whatever persona is chosen.

const VAR = /\{(dogName|streakDays|xpEarned|comboCount|rankTitle)\}/g;

/** Fills {dogName}, {streakDays}, {xpEarned}, {comboCount} and {rankTitle}; unknown braces stay as written. */
export function interpolate(template: string, vars: Partial<PersonaContextVars>): string {
  return template.replace(VAR, (match, key: keyof PersonaContextVars) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

/** Whether a stored string is a persona id. */
export const isPersonaId = (value: unknown): value is PersonaId => typeof value === 'string' && Object.prototype.hasOwnProperty.call(PERSONAS, value);

/** The persona that actually speaks: CLINICAL_PRO during any emergency flow. */
export function resolvePersona(active: PersonaId, emergency: boolean): PersonaId {
  return emergency ? 'CLINICAL_PRO' : active;
}

/** A single-line surface in a persona's voice. */
export function formatCopy(persona: PersonaId, key: PersonaCopyKey, vars: Partial<PersonaContextVars>, emergency = false): string {
  return interpolate(PERSONAS[resolvePersona(persona, emergency)].copy[key], vars);
}

/** The praise for a rep: escalates with the combo, ×1 → FEVER ×5. */
export function praiseFor(persona: PersonaId, combo: number, vars: Partial<PersonaContextVars>): string {
  const lines = PERSONAS[persona].copy.repHitPraise;
  return interpolate(lines[comboTierIndex(combo)] ?? lines[0], { ...vars, comboCount: combo });
}

/** The prompt for loot-box tap 0, 1 or 2. */
export function lootPromptFor(persona: PersonaId, tap: number): string {
  const prompts = PERSONAS[persona].copy.lootBoxTapPrompt;
  return prompts[Math.max(0, Math.min(2, tap))] ?? prompts[0];
}

/** The persona to send with a chat message: a message that trips the emergency guardrails is clinical. */
export function aiPersonaFor(active: PersonaId | null, message: string): PersonaId {
  return resolvePersona(active ?? DEFAULT_PERSONA, checkEmergency(message).level === 'critical');
}

/** The morning greeting before 17:00, the evening one after. */
export const greetingKey = (hour: number): PersonaCopyKey => (hour < 17 ? 'homeGreetingMorning' : 'homeGreetingEvening');
