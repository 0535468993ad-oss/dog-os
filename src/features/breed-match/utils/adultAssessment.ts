import { ADULT_ASSESSMENT_CHECKLIST } from '../data/adultProtocol';
import type { AdoptionCheckItem, ChecklistProgress } from '../types';

/** Progress through the adult-dog checklist; a decision waits until every safety-critical step is done. */
export function checklistProgress(checkedIds: readonly string[], checklist: readonly AdoptionCheckItem[] = ADULT_ASSESSMENT_CHECKLIST): ChecklistProgress {
  const done = checklist.filter((item) => checkedIds.includes(item.id)).length;
  const missingCritical = checklist.filter((item) => item.critical && !checkedIds.includes(item.id));
  return { done, total: checklist.length, missingCritical, readyToDecide: missingCritical.length === 0 };
}

/** Toggles one id in the checked list (pure, for the hook). */
export function toggleId(checkedIds: readonly string[], id: string): string[] {
  return checkedIds.includes(id) ? checkedIds.filter((checked) => checked !== id) : [...checkedIds, id];
}
