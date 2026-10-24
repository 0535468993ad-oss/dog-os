import type { TrainingCommand } from '../types';

// The training curriculum as knowledge chunks for the AI advisor's library (supabase/knowledge/*.json,
// the format scripts/lib/knowledgeSource.ts validates). Chunks ship unverified: the advisor only grounds
// answers in rows a qualified person has reviewed and flipped to verified.

export interface TrainingKnowledgeChunk {
  slug: string;
  category: 'TRAINING_DRIVE';
  title_he: string;
  content_he: string;
  source_reference: string;
  verified: false;
}

export const TRAINING_KNOWLEDGE_SOURCE = 'Dog OS – תוכנית האילוף בחיזוק חיובי (9 פקודות המאסטר), src/features/training/data/commandsData.ts – ממתין לבדיקה מקצועית';

/** One command as a self-contained chunk: goal, steps with marker timing, mistakes and generalisation. */
export function commandToChunk(command: TrainingCommand): TrainingKnowledgeChunk {
  const steps = command.steps.map((step) => `${step.stepIndex}. ${step.titleHe}: ${step.instructionHe} (מרקר "כן!": ${step.markerCue})`).join('\n');
  const mistakes = command.commonMistakes.map((mistake) => `- ${mistake}`).join('\n');
  return {
    slug: `training-command-${command.id}`,
    category: 'TRAINING_DRIVE',
    title_he: `פקודת "${command.nameHe}" (${command.nameEn}) – אילוף בחיזוק חיובי`,
    content_he: [
      `מטרה: ${command.targetGoal}`,
      'שיטה: חיזוק חיובי בלבד – מרקר ברגע המדויק של ההתנהגות ותגמול תוך 1–2 שניות, בלי כוח ובלי משיכות רצועה.',
      `שלבים:\n${steps}`,
      `טעויות נפוצות:\n${mistakes}`,
      `הכללה לסביבה: ${command.environmentalGeneralization}`,
    ].join('\n\n'),
    source_reference: TRAINING_KNOWLEDGE_SOURCE,
    verified: false,
  };
}

/** The whole curriculum, in teaching order. */
export function trainingKnowledgeChunks(commands: readonly TrainingCommand[]): TrainingKnowledgeChunk[] {
  return commands.map(commandToChunk);
}
