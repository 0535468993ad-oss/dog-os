import type {
  Json,
  KnowledgeArticleRow,
  TrainingModuleRow,
  TrainingModuleStepRow,
  TrainingProgressRow,
} from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';

export interface TrainingModule extends TrainingModuleRow {
  steps: TrainingModuleStepRow[];
}

export interface ArticleStep {
  title: string;
  body: string;
}

export interface KnowledgeArticle extends Omit<KnowledgeArticleRow, 'steps'> {
  steps: ArticleStep[];
}

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

export async function fetchTrainingProgress(dogId: string): Promise<TrainingProgressRow[]> {
  return unwrap(
    await supabase.from('user_training_progress').select('*').eq('dog_id', dogId).order('completed_at', { ascending: false }),
  );
}

export async function setStepCompleted(dogId: string, stepId: string, completed: boolean): Promise<void> {
  if (completed) {
    unwrap(await supabase.from('user_training_progress').upsert({ dog_id: dogId, step_id: stepId }, { onConflict: 'dog_id,step_id', ignoreDuplicates: true }));
  } else {
    unwrap(await supabase.from('user_training_progress').delete().eq('dog_id', dogId).eq('step_id', stepId));
  }
}

function parseSteps(value: Json): ArticleStep[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (item && typeof item === 'object' && !Array.isArray(item) && typeof item.title === 'string' && typeof item.body === 'string') {
      return [{ title: item.title, body: item.body }];
    }
    return [];
  });
}

export async function fetchKnowledgeBase(): Promise<KnowledgeArticle[]> {
  const rows = unwrap(await supabase.from('training_knowledge_base').select('*').order('sort_order'));
  return rows.map((row) => ({ ...row, steps: parseSteps(row.steps) }));
}

export async function fetchBookmarks(): Promise<string[]> {
  const rows = unwrap(await supabase.from('knowledge_bookmarks').select('article_id'));
  return rows.map((row) => row.article_id);
}

export async function setBookmarked(articleId: string, bookmarked: boolean): Promise<void> {
  if (bookmarked) {
    unwrap(await supabase.from('knowledge_bookmarks').upsert({ article_id: articleId }, { onConflict: 'user_id,article_id', ignoreDuplicates: true }));
  } else {
    unwrap(await supabase.from('knowledge_bookmarks').delete().eq('article_id', articleId));
  }
}
