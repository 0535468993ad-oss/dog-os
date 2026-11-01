import type { CareUrgency, VetSymptomRow } from '@/lib/database.types';

import { mostUrgent, type VetArticle } from '../api';

export const MAX_MATCHES = 8;

/** This many signs together warrant a vet check even when each alone could be watched at home. */
export const MULTI_SIGN_THRESHOLD = 2;

/**
 * Why the verdict is what it is. RED_FLAG: a checked warning sign. MULTIPLE_SIGNS: several mild signs
 * together. SYMPTOM: the most urgent selected symptom on its own.
 */
export type TriageReason = 'RED_FLAG' | 'MULTIPLE_SIGNS' | 'SYMPTOM';

export interface TriageInput {
  symptoms: VetSymptomRow[];
  selectedIds: string[];
  checkedRedFlags: string[];
  articles: VetArticle[];
  conditionsBySymptom: Map<string, string[]>;
}

export interface TriageResult {
  /** Red flags to ask about for the selected symptoms (deduplicated). */
  redFlagOptions: string[];
  /** null until a symptom is selected. Any checked red flag means an emergency. */
  urgency: CareUrgency | null;
  /** null until a symptom is selected. */
  reason: TriageReason | null;
  /** Related articles, most selected symptoms first. Information only, never a diagnosis. */
  matches: VetArticle[];
}

/**
 * Turns selected symptoms and red flags into an urgency level, the reason for it, and related articles.
 * It only ever escalates: a checked red flag means an emergency, and several mild signs together mean a
 * vet visit rather than watching at home. It never lowers a symptom's own urgency.
 */
export function triageSymptoms({ symptoms, selectedIds, checkedRedFlags, articles, conditionsBySymptom }: TriageInput): TriageResult {
  const chosen = symptoms.filter((s) => selectedIds.includes(s.id));
  const redFlagOptions = [...new Set(chosen.flatMap((s) => s.red_flags))];
  const activeFlags = checkedRedFlags.filter((flag) => redFlagOptions.includes(flag));

  const base = mostUrgent(chosen.map((s) => s.base_urgency));
  let urgency: CareUrgency | null = null;
  let reason: TriageReason | null = null;
  if (base !== null) {
    if (activeFlags.length) [urgency, reason] = ['emergency', 'RED_FLAG'];
    else if (base === 'home_care' && chosen.length >= MULTI_SIGN_THRESHOLD) [urgency, reason] = ['vet_visit', 'MULTIPLE_SIGNS'];
    else [urgency, reason] = [base, 'SYMPTOM'];
  }

  const scores = new Map<string, number>();
  for (const s of chosen) for (const id of conditionsBySymptom.get(s.id) ?? []) scores.set(id, (scores.get(id) ?? 0) + 1);
  const matches = articles
    .filter((a) => scores.has(a.id))
    .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || a.sort_order - b.sort_order)
    .slice(0, MAX_MATCHES);

  return { redFlagOptions, urgency, reason, matches };
}
