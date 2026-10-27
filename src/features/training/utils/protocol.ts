import { BALANCED_PROTOCOLS } from '../data/balancedProtocols';
import type { GearItem, MarkerKind, NerveProfile, TrainingCommand, TrainingTrack, TroubleshootingEntry } from '../types';

export interface ProtocolStep {
  titleHe?: string;
  textHe: string;
  /** When to mark (reward-based steps). */
  markerCue?: string;
  /** The marker word for this step: "כן!" (terminal) or "טוב" (continuation). */
  markerWord?: string;
  /** Leash, hands, body and timing (reward-based steps). */
  handlerMechanics?: string;
}

export interface ResolvedProtocol {
  summaryHe: string;
  steps: ProtocolStep[];
  /** The command's generalisation step – the last thing shown, ending with the mandatory rule. */
  generalizationHe: string;
  gear: GearItem[];
  /** The balanced track's safety cautions; empty on the force-free track. */
  cautionsHe: readonly string[];
  /** The command's troubleshooting, on both tracks (escalations are filtered where they are shown). */
  troubleshooting: readonly TroubleshootingEntry[];
}

const FORCE_FREE_SUMMARY = 'חיזוק חיובי בלבד: מרקר ברגע המדויק של ההתנהגות, ותגמול תוך 1–1.5 שניות. בלי כוח ובלי משיכות רצועה.';

/** The spoken marker for a step: terminal releases the dog to the reward, continuation keeps it in position. */
export function markerWordFor(command: TrainingCommand, kind: MarkerKind): string {
  return kind === 'TERMINAL' ? command.markers.terminal : command.markers.continuation;
}

/** A command's protocol for one track. Both tracks end with the command's generalisation step. */
export function protocolFor(command: TrainingCommand, track: TrainingTrack): ResolvedProtocol {
  if (track === 'FORCE_FREE') {
    return {
      summaryHe: FORCE_FREE_SUMMARY,
      steps: command.steps.map((step) => ({
        titleHe: step.titleHe,
        textHe: step.instructionHe,
        markerCue: step.markerCue,
        markerWord: markerWordFor(command, step.marker),
        handlerMechanics: step.handlerMechanics,
      })),
      generalizationHe: command.environmentalGeneralization,
      gear: [...command.gear],
      cautionsHe: [],
      troubleshooting: command.balancedTroubleshooting,
    };
  }
  const balanced = BALANCED_PROTOCOLS[command.id];
  return {
    summaryHe: balanced.summaryHe,
    steps: balanced.stepsHe.map((textHe) => ({ textHe })),
    generalizationHe: command.environmentalGeneralization,
    gear: [...command.gear, ...balanced.gear],
    cautionsHe: balanced.cautionsHe,
    troubleshooting: command.balancedTroubleshooting,
  };
}

/**
 * The troubleshooting tips in display order: the dog's profile first, the rest in their written order. The
 * balanced escalation is dropped unless the owner is on the balanced track with access, and never shown for a
 * sensitive dog.
 */
export function troubleshootingFor(entries: readonly TroubleshootingEntry[], nerve: NerveProfile | null, showEscalation: boolean): ShownTroubleshooting[] {
  const allowEscalation = showEscalation && nerve !== 'SENSITIVE_SOFT';
  const shown = entries.map((entry) => ({
    commonMistake: entry.commonMistake,
    correctionOrAdjustment: entry.correctionOrAdjustment,
    balancedEscalation: allowEscalation ? (entry.balancedEscalation ?? null) : null,
    highlighted: nerve !== null && entry.highlightFor.includes(nerve),
  }));
  return [...shown.filter((entry) => entry.highlighted), ...shown.filter((entry) => !entry.highlighted)];
}

/** A troubleshooting tip as one dog sees it. */
export interface ShownTroubleshooting {
  commonMistake: string;
  correctionOrAdjustment: string;
  /** null when hidden for this dog or track. */
  balancedEscalation: string | null;
  /** Listed first: tagged for this dog's nerve profile. */
  highlighted: boolean;
}
