import type { TrainingModuleStepRow, TrainingProgressRow } from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';

import type { TrainingModule } from '../types';

/** The module catalog with each module's steps, in display order. */
export async function fetchTrainingCatalog(): Promise<TrainingModule[]> {
  const [modules, steps] = await Promise.all([
    supabase.from('training_modules').select('*').order('sort_order'),
    supabase.from('training_module_steps').select('*').order('position'),
  ]);
  const stepsByModule = new Map<string, TrainingModuleStepRow[]>();
  for (const step of unwrap(steps)) {
    const list = stepsByModule.get(step.module_id) ?? [];
    list.push(step);
    stepsByModule.set(step.module_id, list);
  }
  return unwrap(modules).map((module) => ({ ...module, steps: stepsByModule.get(module.id) ?? [] }));
}

/** A dog's completed steps, newest first. */
export async function fetchTrainingProgress(dogId: string): Promise<TrainingProgressRow[]> {
  return unwrap(
    await supabase.from('user_training_progress').select('*').eq('dog_id', dogId).order('completed_at', { ascending: false }),
  );
}

/** Marks a module step done (idempotent) or not done for a dog. */
export async function setStepCompleted(dogId: string, stepId: string, completed: boolean): Promise<void> {
  if (completed) {
    unwrap(await supabase.from('user_training_progress').upsert({ dog_id: dogId, step_id: stepId }, { onConflict: 'dog_id,step_id', ignoreDuplicates: true }));
  } else {
    unwrap(await supabase.from('user_training_progress').delete().eq('dog_id', dogId).eq('step_id', stepId));
  }
}
