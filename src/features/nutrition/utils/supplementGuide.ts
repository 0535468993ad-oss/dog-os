import type { FoodProduct, ServingPlan } from '../types';
import { numberHe } from './format';

/**
 * EPA + DHA range for dogs with joint disease, per kg^0.75 (Tufts Cummings School of Veterinary Medicine,
 * 310–370 mg). A therapeutic amount: shown as context for the vet conversation, not as a dose.
 */
export const OMEGA3_JOINT_MG_PER_KG075 = { min: 310, max: 370 } as const;

/** The day's EPA + DHA range for a dog of this weight, in mg. */
export function omega3JointRangeMg(weightKg: number): { min: number; max: number } {
  const metabolic = weightKg ** 0.75;
  return { min: OMEGA3_JOINT_MG_PER_KG075.min * metabolic, max: OMEGA3_JOINT_MG_PER_KG075.max * metabolic };
}

/** A supplement's plan: the label's dosing, plus the joint omega-3 range for fish oils. */
export function supplementPlan(product: FoodProduct, weightKg: number): Extract<ServingPlan, { status: 'supplement' }> {
  const labelDosingHe = product.labelDosingHe ?? 'לפי ההוראות שעל האריזה, ובתיאום עם הווטרינר.';
  if (product.nutritionalSpecs.omega3Percent === undefined) return { status: 'supplement', labelDosingHe };
  const range = omega3JointRangeMg(weightKg);
  return {
    status: 'supplement',
    labelDosingHe,
    omega3TargetHe: `לכלב במשקל ${weightKg} ק״ג עם בעיית מפרקים, מחקרים מצאו תועלת בכ־${numberHe(range.min)}–${numberHe(range.max)} מ״ג EPA ו־DHA ביום יחד. זו כמות טיפולית – קובעים אותה עם הווטרינר.`,
  };
}
