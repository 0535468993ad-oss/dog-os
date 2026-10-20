import type { DogSize } from '@/lib/database.types';

// Daily energy estimate: RER = 70 × kg^0.75, multiplied by a life-stage/activity factor (standard
// veterinary nutrition guidelines). It is a starting point – adjust by body condition and ask the vet.

export type ActivityLevel = 'weight_loss' | 'low' | 'normal' | 'active';

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  weight_loss: 'הרזיה',
  low: 'פעילות נמוכה',
  normal: 'פעילות רגילה',
  active: 'פעיל מאוד',
};

export type LifeStage = 'young_puppy' | 'puppy' | 'adult' | 'senior';

export const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  young_puppy: 'גור (עד 4 חודשים)',
  puppy: 'גור בגדילה',
  adult: 'בוגר',
  senior: 'מבוגר',
};

const ADULT_FACTORS: Record<ActivityLevel, number> = { weight_loss: 1.0, low: 1.4, normal: 1.6, active: 2.0 };
const SENIOR_FACTORS: Record<ActivityLevel, number> = { weight_loss: 1.0, low: 1.2, normal: 1.4, active: 1.6 };

export function lifeStage(ageMonths: number, size: DogSize): LifeStage {
  const growthEnds = size === 'giant' ? 18 : size === 'large' ? 15 : 12;
  const seniorFrom = size === 'giant' ? 72 : size === 'large' ? 84 : 96;
  if (ageMonths < 4) return 'young_puppy';
  if (ageMonths < growthEnds) return 'puppy';
  if (ageMonths >= seniorFrom) return 'senior';
  return 'adult';
}

export function restingEnergy(weightKg: number): number {
  return 70 * weightKg ** 0.75;
}

export function energyFactor(stage: LifeStage, activity: ActivityLevel): number {
  if (stage === 'young_puppy') return 3.0;
  if (stage === 'puppy') return 2.0;
  return stage === 'senior' ? SENIOR_FACTORS[activity] : ADULT_FACTORS[activity];
}

export interface PortionPlan {
  stage: LifeStage;
  dailyKcal: number;
  gramsPerDay: number;
  gramsPerMeal: number;
}

export function calculatePortion(input: {
  weightKg: number;
  ageMonths: number;
  size: DogSize;
  activity: ActivityLevel;
  kcalPer100g: number;
  mealsPerDay: number;
}): PortionPlan {
  const stage = lifeStage(input.ageMonths, input.size);
  const dailyKcal = restingEnergy(input.weightKg) * energyFactor(stage, input.activity);
  const gramsPerDay = (dailyKcal / input.kcalPer100g) * 100;
  return {
    stage,
    dailyKcal: Math.round(dailyKcal),
    gramsPerDay: Math.round(gramsPerDay),
    gramsPerMeal: Math.round(gramsPerDay / input.mealsPerDay),
  };
}
