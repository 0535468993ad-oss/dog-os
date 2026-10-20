import type { SafetyTier } from '../types';

/** Tier names as the badge says them – words, so the verdict never depends on color alone. */
export const TIER_LABELS: Record<SafetyTier, string> = {
  SAFE: 'בטוח',
  CAUTION: 'בזהירות',
  TOXIC: 'רעיל – לא לתת',
};
