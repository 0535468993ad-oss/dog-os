import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';

import { israelDate } from './http.ts';

// Everything Dog OS knows about one dog, loaded through the caller's RLS-scoped client and rendered
// as a compact text block for the model. Shared by the chat and insights functions.

interface DogRow {
  id: string;
  name: string;
  breed: string;
  breed_id: string | null;
  birth_date: string;
  size: string;
  weight_kg: number | null;
}

export interface ActiveModule {
  id: string;
  title: string;
  completedSteps: number;
  totalSteps: number;
}

export interface DogContext {
  dog: DogRow;
  ageMonths: number;
  streakDays: number;
  activeModule: ActiveModule | null;
  overdueVaccinations: string[];
  /** Rendered for the model. */
  text: string;
}

/**
 * Owner-written text goes inside <dog_profile> in the system prompt. Neutralise angle brackets so it
 * can never close that tag or open new ones (prompt injection), collapse newlines, and cap the length.
 */
function ownerText(value: unknown, max = 300): string {
  return String(value ?? '')
    .replace(/</g, '‹')
    .replace(/>/g, '›')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function monthsBetween(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let months = (ty! - by!) * 12 + (tm! - bm!);
  if (td! < bd!) months -= 1;
  return Math.max(0, months);
}

function formatAge(months: number): string {
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} years ${rest} months` : `${years} years`;
}

function lifeStage(months: number, size: string): string {
  const seniorAt = size === 'giant' ? 72 : size === 'large' ? 84 : 96;
  if (months < 12) return 'puppy';
  if (months < 24) return 'adolescent / young adult';
  if (months >= seniorAt) return 'senior';
  return 'adult';
}

/** Consecutive days (ending today or yesterday) with at least one completed training step. */
export function computeStreak(completionDates: string[], today: string): number {
  const days = new Set(completionDates);
  const cursor = new Date(`${today}T12:00:00Z`);
  if (!days.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function loadDogContext(db: SupabaseClient, dogId: string): Promise<DogContext | null> {
  const today = israelDate();

  const { data: dog, error: dogError } = await db
    .from('dogs')
    .select('id, name, breed, breed_id, birth_date, size, weight_kg')
    .eq('id', dogId)
    .maybeSingle<DogRow>();
  if (dogError) throw dogError;
  if (!dog) return null;

  const [weights, vaccinations, food, notes, journal, progress, steps, modules, predispositions] = await Promise.all([
    db.from('weight_logs').select('weight_kg, measured_on').eq('dog_id', dogId).order('measured_on', { ascending: false }).limit(6),
    db.from('vaccinations').select('name, last_given, due_date').eq('dog_id', dogId).order('due_date', { ascending: true }),
    db.from('food_portions').select('food_name, kcal_per_100g, grams_per_meal, meals_per_day').eq('dog_id', dogId),
    db.from('medical_notes').select('title, body, noted_on').eq('dog_id', dogId).order('noted_on', { ascending: false }).limit(5),
    db.from('journal_entries').select('entry_date, category, mood, note').eq('dog_id', dogId).order('entry_date', { ascending: false }).limit(7),
    db.from('user_training_progress').select('step_id, completed_at').eq('dog_id', dogId).order('completed_at', { ascending: false }).limit(500),
    db.from('training_module_steps').select('id, module_id'),
    db.from('training_modules').select('id, title'),
    dog.breed_id
      ? db.from('veterinary_knowledge_base').select('title, summary').eq('category', 'breed_health').contains('breeds', [dog.breed_id]).limit(3)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [weights, vaccinations, food, notes, journal, progress, steps, modules, predispositions]) {
    if (result.error) throw result.error;
  }

  type Row = Record<string, unknown>;
  const rows = (result: { data: unknown }) => (result.data ?? []) as Row[];

  // Training progress per module.
  const moduleOfStep = new Map(rows(steps).map((s) => [String(s.id), String(s.module_id)]));
  const totalSteps = new Map<string, number>();
  for (const moduleId of moduleOfStep.values()) totalSteps.set(moduleId, (totalSteps.get(moduleId) ?? 0) + 1);
  const moduleTitles = new Map(rows(modules).map((m) => [String(m.id), String(m.title)]));

  const completedPerModule = new Map<string, number>();
  const lastActivity = new Map<string, string>();
  const completionDays: string[] = [];
  for (const p of rows(progress)) {
    const moduleId = moduleOfStep.get(String(p.step_id));
    const completedAt = String(p.completed_at);
    completionDays.push(israelDate(new Date(completedAt)));
    if (!moduleId) continue;
    completedPerModule.set(moduleId, (completedPerModule.get(moduleId) ?? 0) + 1);
    if (!lastActivity.has(moduleId)) lastActivity.set(moduleId, completedAt); // rows are newest first
  }

  const inProgress = [...completedPerModule.entries()]
    .filter(([id, done]) => done < (totalSteps.get(id) ?? 0))
    .sort((a, b) => (lastActivity.get(b[0]) ?? '').localeCompare(lastActivity.get(a[0]) ?? ''));
  const completedModules = [...completedPerModule.entries()]
    .filter(([id, done]) => done >= (totalSteps.get(id) ?? Infinity))
    .map(([id]) => moduleTitles.get(id) ?? id);

  const activeEntry = inProgress[0];
  const activeModule: ActiveModule | null = activeEntry
    ? {
        id: activeEntry[0],
        title: moduleTitles.get(activeEntry[0]) ?? activeEntry[0],
        completedSteps: activeEntry[1],
        totalSteps: totalSteps.get(activeEntry[0]) ?? 0,
      }
    : null;

  const ageMonths = monthsBetween(dog.birth_date, today);
  const streakDays = computeStreak(completionDays, today);
  const overdueVaccinations = rows(vaccinations)
    .filter((v) => typeof v.due_date === 'string' && v.due_date < today)
    .map((v) => String(v.name));

  const lines: string[] = [
    `Today (Israel): ${today}`,
    `Name: ${ownerText(dog.name, 50)}`,
    `Breed: ${ownerText(dog.breed, 80)}${dog.breed_id ? ` (${dog.breed_id})` : ''}`,
    `Birth date: ${dog.birth_date} (age ${formatAge(ageMonths)}, life stage: ${lifeStage(ageMonths, dog.size)})`,
    `Size class: ${dog.size}`,
    `Current weight: ${dog.weight_kg ?? 'unknown'} kg`,
  ];

  const weightRows = rows(weights);
  if (weightRows.length) {
    lines.push(`Weight log (newest first): ${weightRows.map((w) => `${w.measured_on}: ${w.weight_kg} kg`).join('; ')}`);
  }
  const vaccinationRows = rows(vaccinations);
  lines.push(
    vaccinationRows.length
      ? `Vaccinations: ${vaccinationRows
          .map((v) => `${ownerText(v.name, 80)} (last given ${v.last_given ?? 'unknown'}, next due ${v.due_date ?? 'not set'}${typeof v.due_date === 'string' && v.due_date < today ? ', OVERDUE' : ''})`)
          .join('; ')}`
      : 'Vaccinations: none recorded in the app',
  );
  const foodRows = rows(food);
  if (foodRows.length) {
    lines.push(`Feeding plan: ${foodRows.map((f) => `${ownerText(f.food_name, 80)}:${f.meals_per_day} meals × ${f.grams_per_meal} g${f.kcal_per_100g ? ` (${f.kcal_per_100g} kcal/100g)` : ''}`).join('; ')}`);
  }
  const noteRows = rows(notes);
  if (noteRows.length) {
    lines.push(`Medical notes (newest first): ${noteRows.map((n) => `${n.noted_on} – ${ownerText(n.title, 120)}${n.body ? `: ${ownerText(n.body)}` : ''}`).join(' | ')}`);
  }
  const predispositionRows = rows(predispositions);
  if (predispositionRows.length) {
    lines.push(`Known breed health predispositions: ${predispositionRows.map((p) => `${p.title} – ${p.summary}`).join(' | ')}`);
  }
  lines.push(
    activeModule
      ? `Active training module: ${activeModule.title} (${activeModule.completedSteps}/${activeModule.totalSteps} steps done)`
      : 'Active training module: none in progress',
  );
  if (completedModules.length) lines.push(`Completed training modules: ${completedModules.join(', ')}`);
  lines.push(`Training streak: ${streakDays} day(s)`);
  const journalRows = rows(journal);
  if (journalRows.length) {
    lines.push(
      `Recent journal (newest first, written by the owner): ${journalRows
        .map((j) => `${j.entry_date} [${j.category}${j.mood ? `, mood ${j.mood}` : ''}] ${ownerText(j.note)}`)
        .join(' | ')}`,
    );
  }

  return { dog, ageMonths, streakDays, activeModule, overdueVaccinations, text: lines.join('\n') };
}
