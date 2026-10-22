import { GENERALIZATION_RULE_HE } from '../data/methodology';
import type { GearItem, MasterCommand, TrainingTrack } from '../types';

export interface ResolvedProtocol {
  summaryHe: string;
  /** The track's steps, always ending with the generalisation rule. */
  stepsHe: string[];
  gear: GearItem[];
  cautionsHe: readonly string[];
}

/** A command's protocol for one track: its steps plus the mandatory generalisation step, and all its gear. */
export function protocolFor(command: MasterCommand, track: TrainingTrack): ResolvedProtocol {
  const protocol = track === 'FORCE_FREE' ? command.forceFree : command.balanced;
  return {
    summaryHe: protocol.summaryHe,
    stepsHe: [...protocol.stepsHe, GENERALIZATION_RULE_HE],
    gear: [...command.gear, ...protocol.gear],
    cautionsHe: protocol.cautionsHe,
  };
}
