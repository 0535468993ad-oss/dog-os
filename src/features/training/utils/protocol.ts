import { BALANCED_PROTOCOLS } from '../data/balancedProtocols';
import type { GearItem, TrainingCommand, TrainingTrack } from '../types';

export interface ProtocolStep {
  titleHe?: string;
  textHe: string;
  /** When to say "כן!" / click (reward-based steps). */
  markerCue?: string;
}

export interface ResolvedProtocol {
  summaryHe: string;
  steps: ProtocolStep[];
  /** The command's generalisation step – the last thing shown, ending with the mandatory rule. */
  generalizationHe: string;
  gear: GearItem[];
  cautionsHe: readonly string[];
}

const FORCE_FREE_SUMMARY = 'חיזוק חיובי בלבד: מרקר ברגע המדויק של ההתנהגות, ותגמול תוך 1–2 שניות. בלי כוח ובלי משיכות רצועה.';

/** A command's protocol for one track. Both tracks end with the command's generalisation step. */
export function protocolFor(command: TrainingCommand, track: TrainingTrack): ResolvedProtocol {
  if (track === 'FORCE_FREE') {
    return {
      summaryHe: FORCE_FREE_SUMMARY,
      steps: command.steps.map((step) => ({ titleHe: step.titleHe, textHe: step.instructionHe, markerCue: step.markerCue })),
      generalizationHe: command.environmentalGeneralization,
      gear: [...command.gear],
      cautionsHe: command.commonMistakes,
    };
  }
  const balanced = BALANCED_PROTOCOLS[command.id];
  return {
    summaryHe: balanced.summaryHe,
    steps: balanced.stepsHe.map((textHe) => ({ textHe })),
    generalizationHe: command.environmentalGeneralization,
    gear: [...command.gear, ...balanced.gear],
    cautionsHe: balanced.cautionsHe,
  };
}
