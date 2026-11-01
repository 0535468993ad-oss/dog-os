import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  CareUrgency,
  FoodPortionRow,
  Json,
  MedicalNoteRow,
  VaccinationRow,
  VetArticleRow,
  VetSymptomConditionRow,
  VetSymptomRow,
  WeightLogRow,
} from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';
import { reportError } from '@/utils/errors';

import { parseStoredKnowledge, toStoredKnowledge } from './logic/storedKnowledge';

export interface HealthData {
  vaccinations: VaccinationRow[];
  weights: WeightLogRow[]; // oldest first
  food: FoodPortionRow[];
  notes: MedicalNoteRow[]; // newest first
}

export async function fetchHealth(dogId: string): Promise<HealthData> {
  const [vaccinations, weights, food, notes] = await Promise.all([
    supabase.from('vaccinations').select('*').eq('dog_id', dogId).order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('weight_logs').select('*').eq('dog_id', dogId).order('measured_on', { ascending: true }),
    supabase.from('food_portions').select('*').eq('dog_id', dogId).order('created_at'),
    supabase.from('medical_notes').select('*').eq('dog_id', dogId).order('noted_on', { ascending: false }),
  ]);
  return { vaccinations: unwrap(vaccinations), weights: unwrap(weights), food: unwrap(food), notes: unwrap(notes) };
}

export interface VaccinationInput {
  name: string;
  lastGiven: string | null;
  dueDate: string | null;
  notes: string | null;
}

export async function saveVaccination(dogId: string, input: VaccinationInput, id?: string): Promise<void> {
  const row = { dog_id: dogId, name: input.name, last_given: input.lastGiven, due_date: input.dueDate, notes: input.notes };
  unwrap(id ? await supabase.from('vaccinations').update(row).eq('id', id) : await supabase.from('vaccinations').insert(row));
}

export async function deleteVaccination(id: string): Promise<void> {
  unwrap(await supabase.from('vaccinations').delete().eq('id', id));
}

/**
 * One weigh-in per day: logging again on the same date replaces it. The dog's current weight follows the
 * latest log via a database trigger, in the same transaction (migration 20261018120700).
 */
export async function logWeight(dogId: string, weightKg: number, measuredOn: string): Promise<void> {
  unwrap(
    await supabase
      .from('weight_logs')
      .upsert({ dog_id: dogId, weight_kg: weightKg, measured_on: measuredOn }, { onConflict: 'dog_id,measured_on' }),
  );
}

export async function deleteWeight(id: string): Promise<void> {
  unwrap(await supabase.from('weight_logs').delete().eq('id', id));
}

export interface FoodInput {
  foodName: string;
  kcalPer100g: number | null;
  gramsPerMeal: number;
  mealsPerDay: number;
  notes: string | null;
}

export async function saveFood(dogId: string, input: FoodInput, id?: string): Promise<void> {
  const row = {
    dog_id: dogId,
    food_name: input.foodName,
    kcal_per_100g: input.kcalPer100g,
    grams_per_meal: input.gramsPerMeal,
    meals_per_day: input.mealsPerDay,
    notes: input.notes,
  };
  unwrap(id ? await supabase.from('food_portions').update(row).eq('id', id) : await supabase.from('food_portions').insert(row));
}

export async function deleteFood(id: string): Promise<void> {
  unwrap(await supabase.from('food_portions').delete().eq('id', id));
}

export interface NoteInput {
  title: string;
  body: string;
  notedOn: string;
}

export async function saveNote(dogId: string, input: NoteInput, id?: string): Promise<void> {
  const row = { dog_id: dogId, title: input.title, body: input.body, noted_on: input.notedOn };
  unwrap(id ? await supabase.from('medical_notes').update(row).eq('id', id) : await supabase.from('medical_notes').insert(row));
}

export async function deleteNote(id: string): Promise<void> {
  unwrap(await supabase.from('medical_notes').delete().eq('id', id));
}

// ---------------------------------------------------------------- Veterinary knowledge

export interface VetAction {
  title: string;
  body: string;
}

export interface VetArticle extends Omit<VetArticleRow, 'actions'> {
  actions: VetAction[];
}

export interface VetKnowledge {
  articles: VetArticle[];
  symptoms: VetSymptomRow[];
  /** symptom id -> article ids */
  conditionsBySymptom: Map<string, string[]>;
  /** Served from the device copy because the network failed: screens say so and offer a retry. */
  offline?: boolean;
}

function parseActions(value: Json): VetAction[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    item && typeof item === 'object' && !Array.isArray(item) && typeof item.title === 'string' && typeof item.body === 'string'
      ? [{ title: item.title, body: item.body }]
      : [],
  );
}

export async function fetchVetKnowledge(): Promise<VetKnowledge> {
  const [articles, symptoms, mapping] = await Promise.all([
    supabase.from('veterinary_knowledge_base').select('*').order('sort_order'),
    supabase.from('vet_symptoms').select('*').order('sort_order'),
    supabase.from('vet_symptom_conditions').select('*'),
  ]);
  const conditionsBySymptom = new Map<string, string[]>();
  for (const row of unwrap(mapping) as VetSymptomConditionRow[]) {
    conditionsBySymptom.set(row.symptom_id, [...(conditionsBySymptom.get(row.symptom_id) ?? []), row.article_id]);
  }
  return {
    articles: unwrap(articles).map((row) => ({ ...row, actions: parseActions(row.actions) })),
    symptoms: unwrap(symptoms),
    conditionsBySymptom,
  };
}

const KNOWLEDGE_COPY_KEY = 'vet-knowledge:v1';
const VET_PHONE_KEY = 'vet-phone:v1';

/**
 * The knowledge base, falling back to the device copy when the network fails, so first aid opens with no
 * signal. Each successful fetch refreshes the copy; with no copy either, the network error is thrown.
 */
export async function loadVetKnowledge(): Promise<VetKnowledge> {
  try {
    const knowledge = await fetchVetKnowledge();
    AsyncStorage.setItem(KNOWLEDGE_COPY_KEY, JSON.stringify(toStoredKnowledge(knowledge))).catch((error: unknown) => reportError(error, 'health/saveKnowledgeCopy'));
    return knowledge;
  } catch (error) {
    const copy = parseStoredKnowledge(await AsyncStorage.getItem(KNOWLEDGE_COPY_KEY).catch(() => null));
    if (copy) return copy;
    throw error;
  }
}

/** The owner's vet number, kept on this device only (never uploaded). */
export async function loadVetPhone(): Promise<string | null> {
  return AsyncStorage.getItem(VET_PHONE_KEY);
}

/** Saves the vet number on this device, or removes it when null. */
export async function saveVetPhone(phone: string | null): Promise<void> {
  if (phone === null) await AsyncStorage.removeItem(VET_PHONE_KEY);
  else await AsyncStorage.setItem(VET_PHONE_KEY, phone);
}

/** Removes the signed-out user's device-only health data (the vet number; shared knowledge stays). */
export async function clearDeviceHealthData(): Promise<void> {
  await AsyncStorage.removeItem(VET_PHONE_KEY);
}

export const URGENCY_ORDER: Record<CareUrgency, number> = { emergency: 0, vet_visit: 1, home_care: 2 };

export function mostUrgent(levels: CareUrgency[]): CareUrgency | null {
  return levels.reduce<CareUrgency | null>((best, level) => (best === null || URGENCY_ORDER[level] < URGENCY_ORDER[best] ? level : best), null);
}
