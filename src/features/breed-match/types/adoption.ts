export interface DecompressionStage {
  id: 'days' | 'weeks' | 'months';
  titleHe: string;
  bodyHe: string;
}

export interface AdoptionCheckItem {
  id: string;
  titleHe: string;
  detailHe: string;
  /** Safety-critical: skipping it risks a bite or a wrong decision. */
  critical: boolean;
}

export interface ChecklistProgress {
  done: number;
  total: number;
  missingCritical: AdoptionCheckItem[];
  readyToDecide: boolean;
}
