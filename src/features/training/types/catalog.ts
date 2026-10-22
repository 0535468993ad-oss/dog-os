import type { KnowledgeArticleRow, KnowledgeCategory, TrainingMethod, TrainingModuleRow, TrainingModuleStepRow } from '@/lib/database.types';

/** A training module with its ordered steps (server catalog). */
export interface TrainingModule extends TrainingModuleRow {
  steps: TrainingModuleStepRow[];
}

export interface ArticleStep {
  title: string;
  body: string;
}

/** An encyclopedia article with its steps parsed from JSON. */
export interface KnowledgeArticle extends Omit<KnowledgeArticleRow, 'steps'> {
  steps: ArticleStep[];
}

export interface ModuleProgress {
  completed: number;
  total: number;
  ratio: number;
}

export type CategoryFilter = KnowledgeCategory | 'all' | 'saved';
export type MethodFilter = TrainingMethod | 'all';

export interface ArticleFilter {
  query: string;
  category: CategoryFilter;
  method: MethodFilter;
  /** Ids of the user's bookmarked articles (for the "saved" filter). */
  saved: ReadonlySet<string>;
}
