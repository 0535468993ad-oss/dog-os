import type { ActivityLevel, DogNutritionProfile, EnergyBudget } from '../types';
import { TRAINING_TREAT_SHARE } from './trainingReserve';

/** Maintenance factor × RER for adult dogs (WSAVA / NRC ranges): couch, typical neutered adult, working/training. */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = { low: 1.4, normal: 1.6, active: 1.8 };

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  low: 'רגוע',
  normal: 'רגיל',
  active: 'פעיל / באימונים',
};

/** Resting energy requirement, kcal/day: RER = 70 × kg^0.75. */
export function restingEnergyKcal(weightKg: number): number {
  return 70 * weightKg ** 0.75;
}

/** Why the adult formula doesn't apply, or null when it does. Growing dogs need their own feeding plan. */
export function unsupportedAgeReason(profile: Pick<DogNutritionProfile, 'ageMonths' | 'isLargeBreed'>): string | null {
  const adultAt = profile.isLargeBreed ? 18 : 12;
  if (profile.ageMonths < adultAt) {
    return `עד גיל ${adultAt} חודשים הכלב עוד גדל, והצרכים שלו אחרים. בגיל הזה מאכילים לפי טבלת הגורים שעל השק, ובודקים משקל אצל הווטרינר.`;
  }
  return null;
}

/**
 * The day's calories, with a share kept for training rewards and the rest for the bowl. All values are
 * rounded to whole kcal; treat + bowl always add up to the daily total.
 */
export function energyBudget(profile: Pick<DogNutritionProfile, 'weightKg' | 'activity'>, treatShare = TRAINING_TREAT_SHARE): EnergyBudget {
  const restingKcal = Math.round(restingEnergyKcal(profile.weightKg));
  const dailyKcal = Math.round(restingEnergyKcal(profile.weightKg) * ACTIVITY_FACTORS[profile.activity]);
  const treatKcal = Math.round(dailyKcal * treatShare);
  return { restingKcal, dailyKcal, treatKcal, bowlKcal: dailyKcal - treatKcal, treatSharePercent: Math.round(treatShare * 100) };
}
