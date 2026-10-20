import type { Dog, TrainingSession } from '@/types';

import type { DogRow, TrainingSessionRow } from './database.types';
import { supabase } from './supabaseClient';

const toDog = (row: DogRow): Dog => ({
  id: row.id,
  name: row.name,
  breed: row.breed,
  birthDate: row.birth_date,
  size: row.size,
  photoUrl: row.photo_url ?? undefined,
});

const toTrainingSession = (row: TrainingSessionRow): TrainingSession => ({
  id: row.id,
  dogId: row.dog_id,
  skill: row.skill,
  durationMinutes: row.duration_minutes,
  completedAt: row.completed_at,
  notes: row.notes ?? undefined,
});

// owner_id defaults to auth.uid() in the database and RLS scopes every query to the signed-in user.

export async function listDogs(): Promise<Dog[]> {
  const { data, error } = await supabase.from('dogs').select('*').order('created_at');
  if (error) throw error;
  return data.map(toDog);
}

export async function createDog(dog: Omit<Dog, 'id'>): Promise<Dog> {
  const { data, error } = await supabase
    .from('dogs')
    .insert({
      name: dog.name,
      breed: dog.breed,
      birth_date: dog.birthDate,
      size: dog.size,
      photo_url: dog.photoUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toDog(data);
}

export async function deleteDog(id: string): Promise<void> {
  const { error } = await supabase.from('dogs').delete().eq('id', id);
  if (error) throw error;
}

export async function listTrainingSessions(dogId: string): Promise<TrainingSession[]> {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('dog_id', dogId)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data.map(toTrainingSession);
}

export async function listTrainingSessionsSince(since: Date): Promise<TrainingSession[]> {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*')
    .gte('completed_at', since.toISOString())
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data.map(toTrainingSession);
}

export async function logTrainingSession(
  session: Omit<TrainingSession, 'id'>
): Promise<TrainingSession> {
  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      dog_id: session.dogId,
      skill: session.skill,
      duration_minutes: session.durationMinutes,
      completed_at: session.completedAt,
      notes: session.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toTrainingSession(data);
}
