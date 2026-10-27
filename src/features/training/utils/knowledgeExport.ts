import { NERVE_LABELS_HE } from '../data/assessmentCopy';
import type { TrainingCommand } from '../types';
import { markerWordFor } from './protocol';

// The training curriculum as knowledge chunks for the AI advisor's library (supabase/knowledge/*.json,
// the format scripts/lib/knowledgeSource.ts validates). Chunks ship unverified: the advisor only grounds
// answers in rows a qualified person has reviewed and flipped to verified. Balanced escalations are never
// exported: chat retrieval has no track, age or temperament gate, so gated content stays in the app.

export interface TrainingKnowledgeChunk {
  slug: string;
  category: 'TRAINING_DRIVE';
  title_he: string;
  content_he: string;
  source_reference: string;
  verified: false;
}

export const TRAINING_KNOWLEDGE_SOURCE = 'Dog OS – תוכנית האילוף בחיזוק חיובי (9 פקודות המאסטר), src/features/training/data/commandsData.ts – ממתין לבדיקה מקצועית';

/** One command as a self-contained chunk with numbered steps the advisor can cite ("שלב 2"). */
export function commandToChunk(command: TrainingCommand): TrainingKnowledgeChunk {
  const { markers } = command;
  const steps = command.steps
    .map((step) => `שלב ${step.stepIndex} – ${step.titleHe}: ${step.instructionHe}\nידיים, רצועה וגוף: ${step.handlerMechanics}\nמרקר "${markerWordFor(command, step.marker)}": ${step.markerCue}`)
    .join('\n');
  const troubleshooting = command.balancedTroubleshooting.map((entry) => `- טעות: ${entry.commonMistake}\n  מה עושים: ${entry.correctionOrAdjustment}`).join('\n');
  const profiles = command.suitableForProfiles.map((profile) => NERVE_LABELS_HE[profile]).join(', ');
  return {
    slug: `training-command-${command.id}`,
    category: 'TRAINING_DRIVE',
    title_he: `פקודת "${command.nameHe}" (${command.nameEn}) – אילוף בחיזוק חיובי`,
    content_he: [
      `מטרה: ${command.targetGoal}`,
      `שיטה: חיזוק חיובי – מרקר ברגע המדויק של ההתנהגות ותגמול תוך 1–1.5 שניות, בלי כוח ובלי משיכות רצועה. מרקר סיום: "${markers.terminal}" (התגמול מגיע, אפשר לזוז), מרקר המשך: "${markers.continuation}" (נשארים בתנוחה, התגמול מגיע אל הכלב), מילת שחרור: "${markers.releaseWord}".`,
      `שלבים:\n${steps}`,
      `פתרון תקלות:\n${troubleshooting}`,
      `מומלצת במיוחד לפרופיל: ${profiles}.`,
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
