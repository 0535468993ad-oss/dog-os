import type { TrainingProgressRow } from '@/lib/database.types';
import { computeStreak, toIsoDate } from '@/utils/date';

import type { ModuleProgress, TrainingModule } from '../types';

export interface TrainingSummaryData {
  completedSteps: Set<string>;
  perModule: Map<string, ModuleProgress>;
  activeModule: TrainingModule | null;
  nextModule: TrainingModule | null;
  streak: number;
  completedModules: number;
}

/** Progress per module, the module in progress (latest activity), the next module and the step streak. */
export function summarizeTraining(modules: readonly TrainingModule[], rows: readonly TrainingProgressRow[], today?: string): TrainingSummaryData {
  const completedSteps = new Set(rows.map((row) => row.step_id));
  const moduleOfStep = new Map(modules.flatMap((module) => module.steps.map((step) => [step.id, module.id] as const)));
  // Rows arrive newest first, so the first row seen per module is its latest activity.
  const lastActivity = new Map<string, string>();
  for (const row of rows) {
    const moduleId = moduleOfStep.get(row.step_id);
    if (moduleId && !lastActivity.has(moduleId)) lastActivity.set(moduleId, row.completed_at);
  }

  const perModule = new Map<string, ModuleProgress>(
    modules.map((module) => {
      const completed = module.steps.filter((step) => completedSteps.has(step.id)).length;
      return [module.id, { completed, total: module.steps.length, ratio: module.steps.length ? completed / module.steps.length : 0 }];
    }),
  );

  const activeModule =
    modules
      .filter((module) => {
        const progress = perModule.get(module.id);
        return progress && progress.completed > 0 && progress.completed < progress.total;
      })
      .sort((a, b) => (lastActivity.get(b.id) ?? '').localeCompare(lastActivity.get(a.id) ?? ''))[0] ?? null;

  const nextModule = activeModule ?? modules.find((module) => (perModule.get(module.id)?.completed ?? 0) === 0) ?? null;
  const streak = computeStreak(rows.map((row) => toIsoDate(new Date(row.completed_at))), today);
  const completedModules = modules.filter((module) => {
    const progress = perModule.get(module.id);
    return progress && progress.total > 0 && progress.completed === progress.total;
  }).length;

  return { completedSteps, perModule, activeModule, nextModule, streak, completedModules };
}
