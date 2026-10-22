import type { TrainingModule } from '../api';
import type { ModuleProgress } from '../hooks';
import { DIFFICULTY_LABELS } from '../labels';

/** A module counts as done when every one of its steps is completed. */
export function isModuleComplete(progress: ModuleProgress | undefined): boolean {
  return !!progress && progress.total > 0 && progress.completed === progress.total;
}

/** "רצף אימונים: N יום/ימים" with correct Hebrew singular. */
export function streakTitle(streak: number): string {
  return `רצף אימונים: ${streak} ${streak === 1 ? 'יום' : 'ימים'}`;
}

/** Screen-reader label for a module card: title, difficulty and step progress. */
export function moduleAccessibilityLabel(module: TrainingModule, progress: ModuleProgress | undefined): string {
  return `${module.title}, ${DIFFICULTY_LABELS[module.difficulty]}, ${progress?.completed ?? 0} מתוך ${progress?.total ?? 0} שלבים`;
}
