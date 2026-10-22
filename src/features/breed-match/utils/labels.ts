import type { BreedSize, MatchTier, Rating } from '../types';

export const TIER_LABELS_HE: Readonly<Record<MatchTier, string>> = {
  OPTIMAL: 'התאמה מצוינת',
  GOOD_WITH_ADJUSTMENTS: 'מתאים, עם התאמות',
  HIGH_RISK_MISMATCH: 'אי־התאמה בסיכון גבוה',
};

/** Badge tone per tier (the shared Badge's tones). */
export const TIER_TONES = { OPTIMAL: 'success', GOOD_WITH_ADJUSTMENTS: 'warning', HIGH_RISK_MISMATCH: 'danger' } as const satisfies Record<MatchTier, string>;

export const SIZE_LABELS_HE: Readonly<Record<BreedSize, string>> = {
  SMALL: 'קטן',
  MEDIUM: 'בינוני',
  LARGE: 'גדול',
  GIANT: 'ענק',
};

export const METRIC_LABELS_HE = {
  energyLevel: 'אנרגיה',
  mentalStimulationNeed: 'צורך בתעסוקה מחשבתית',
  sheddingLevel: 'נשירה',
  droolingLevel: 'ריור',
  kidCompatibility: 'התאמה לילדים',
  strangerFriendliness: 'פתיחות לזרים',
  dogSociability: 'חברותיות עם כלבים',
  barkingTendency: 'נטייה לנבוח',
  groomingEffort: 'טיפוח',
  noviceFriendly: 'מתאים למתחילים',
  preyDrive: 'דחף טרף',
} as const;

/** "4 מתוך 5" – the spoken form of a rating. */
export function ratingText(rating: Rating): string {
  return `${rating} מתוך 5`;
}
