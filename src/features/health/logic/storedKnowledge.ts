import type { CareUrgency, OrganSystem, VetCategory, VetSymptomRow } from '@/lib/database.types';

import type { VetAction, VetArticle, VetKnowledge } from '../api';

// The device copy of the veterinary knowledge base, so first aid still opens with no signal after a restart.
// Storage is untrusted: every field is checked again on the way back, and anything malformed is dropped.

export const STORED_KNOWLEDGE_VERSION = 1;

/** What is written to storage (the symptom map as entries, since a Map has no JSON form). */
export interface StoredKnowledge {
  v: typeof STORED_KNOWLEDGE_VERSION;
  articles: VetArticle[];
  symptoms: VetSymptomRow[];
  mapping: [string, string[]][];
}

const CATEGORIES: Readonly<Record<VetCategory, true>> = { emergency: true, condition: true, breed_health: true, preventive: true, medication: true };
const URGENCIES: Readonly<Record<CareUrgency, true>> = { emergency: true, vet_visit: true, home_care: true };
const ORGANS: Readonly<Record<OrganSystem, true>> = {
  cardiovascular: true,
  respiratory: true,
  gastrointestinal: true,
  dermatological: true,
  neurological: true,
  musculoskeletal: true,
  urinary: true,
  endocrine: true,
  ocular: true,
  otic: true,
  dental: true,
  multisystem: true,
};

const own = (map: object, key: unknown): key is string => typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');
const str = (value: unknown): value is string => typeof value === 'string';

/** Turns live knowledge into its storable form. */
export function toStoredKnowledge(knowledge: VetKnowledge): StoredKnowledge {
  return { v: STORED_KNOWLEDGE_VERSION, articles: knowledge.articles, symptoms: knowledge.symptoms, mapping: [...knowledge.conditionsBySymptom.entries()] };
}

function parseAction(value: unknown): VetAction | null {
  return isRecord(value) && str(value.title) && str(value.body) ? { title: value.title, body: value.body } : null;
}

function parseArticle(value: unknown): VetArticle | null {
  if (!isRecord(value)) return null;
  const { id, category, organ_system, urgency, title, summary, overview, signs, causes, actions, when_to_call_vet, prevention, breeds, tags, sort_order, created_at } = value;
  if (!str(id) || !own(CATEGORIES, category) || !str(title) || !str(summary) || !str(overview) || !str(causes) || !str(when_to_call_vet) || !str(prevention) || !str(created_at)) return null;
  if (!(organ_system === null || own(ORGANS, organ_system)) || !(urgency === null || own(URGENCIES, urgency))) return null;
  if (!isStrings(signs) || !isStrings(breeds) || !isStrings(tags) || typeof sort_order !== 'number' || !Array.isArray(actions)) return null;
  const parsedActions = actions.map(parseAction);
  if (parsedActions.some((action) => action === null)) return null;
  return {
    id,
    category: category as VetCategory,
    organ_system: organ_system as OrganSystem | null,
    urgency: urgency as CareUrgency | null,
    title,
    summary,
    overview,
    signs,
    causes,
    actions: parsedActions.filter((action): action is VetAction => action !== null),
    when_to_call_vet,
    prevention,
    breeds,
    tags,
    sort_order,
    created_at,
  };
}

function parseSymptom(value: unknown): VetSymptomRow | null {
  if (!isRecord(value)) return null;
  const { id, name, description, base_urgency, red_flags, sort_order } = value;
  if (!str(id) || !str(name) || !str(description) || !own(URGENCIES, base_urgency) || !isStrings(red_flags) || typeof sort_order !== 'number') return null;
  return { id, name, description, base_urgency: base_urgency as CareUrgency, red_flags, sort_order };
}

/** Parses a stored copy back into knowledge marked `offline`, or null when it is missing, old or malformed. */
export function parseStoredKnowledge(raw: string | null): VetKnowledge | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value) || value.v !== STORED_KNOWLEDGE_VERSION || !Array.isArray(value.articles) || !Array.isArray(value.symptoms) || !Array.isArray(value.mapping)) return null;
  const articles = value.articles.map(parseArticle);
  const symptoms = value.symptoms.map(parseSymptom);
  if (articles.length === 0 || articles.some((a) => a === null) || symptoms.some((s) => s === null)) return null;
  const conditionsBySymptom = new Map<string, string[]>();
  for (const entry of value.mapping) {
    if (!Array.isArray(entry) || !str(entry[0]) || !isStrings(entry[1])) return null;
    conditionsBySymptom.set(entry[0], entry[1]);
  }
  return {
    articles: articles.filter((a): a is VetArticle => a !== null),
    symptoms: symptoms.filter((s): s is VetSymptomRow => s !== null),
    conditionsBySymptom,
    offline: true,
  };
}
