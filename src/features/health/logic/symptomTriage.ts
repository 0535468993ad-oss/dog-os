import type { CareUrgency, VetSymptomRow } from '@/lib/database.types';

import { mostUrgent, type VetArticle } from '../api';

export const MAX_MATCHES = 8;

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
  /** Related articles, most selected symptoms first. Information only, never a diagnosis. */
  matches: VetArticle[];
}

/** Turns selected symptoms and red flags into an urgency level and related articles. */
export function triageSymptoms({ symptoms, selectedIds, checkedRedFlags, articles, conditionsBySymptom }: TriageInput): TriageResult {
  const chosen = symptoms.filter((s) => selectedIds.includes(s.id));
  const redFlagOptions = [...new Set(chosen.flatMap((s) => s.red_flags))];
  const activeFlags = checkedRedFlags.filter((flag) => redFlagOptions.includes(flag));

  const urgency: CareUrgency | null = chosen.length ? (activeFlags.length ? 'emergency' : mostUrgent(chosen.map((s) => s.base_urgency))) : null;

  const scores = new Map<string, number>();
  for (const s of chosen) for (const id of conditionsBySymptom.get(s.id) ?? []) scores.set(id, (scores.get(id) ?? 0) + 1);
  const matches = articles
    .filter((a) => scores.has(a.id))
    .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || a.sort_order - b.sort_order)
    .slice(0, MAX_MATCHES);

  return { redFlagOptions, urgency, matches };
}
