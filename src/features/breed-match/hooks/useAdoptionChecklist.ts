import { useState } from 'react';

import { checklistProgress, toggleId } from '../utils/adultAssessment';

/** The adult-dog checklist the adopter ticks off during visits. */
export function useAdoptionChecklist() {
  const [checked, setChecked] = useState<string[]>([]);
  return {
    checked,
    progress: checklistProgress(checked),
    toggle: (id: string) => setChecked((current) => toggleId(current, id)),
  };
}
