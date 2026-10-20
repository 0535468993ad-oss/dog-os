import type { KnowledgeCategory, TrainingCategory, TrainingDifficulty, TrainingMethod } from '@/lib/database.types';

export const CATEGORY_LABELS: Record<TrainingCategory, string> = {
  basics: 'יסודות',
  obedience: 'צייתנות',
  behavior: 'התנהגות',
  leash: 'רצועה',
  puppy: 'גורים',
  tricks: 'טריקים',
};

export const DIFFICULTY_LABELS: Record<TrainingDifficulty, string> = {
  beginner: 'מתחילים',
  intermediate: 'בינוני',
  advanced: 'מתקדם',
};

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  methodology: 'שיטות ומתודולוגיות',
  behavioral_issue: 'בעיות התנהגות',
  core_command: 'פקודות ליבה',
  puppy_foundation: 'יסודות לגורים',
  working_skill: 'מיומנויות עבודה',
};

export const METHOD_LABELS: Record<TrainingMethod, string> = {
  classical_conditioning: 'התניה קלאסית',
  operant_conditioning: 'התניה אופרנטית',
  positive_reinforcement: 'חיזוק חיובי',
  clicker_training: 'קליקר',
  lima: 'LIMA',
  ethology: 'אתולוגיה',
  cognitive_science: 'מדע קוגניטיבי',
  desensitization: 'דה-סנסיטיזציה',
};
