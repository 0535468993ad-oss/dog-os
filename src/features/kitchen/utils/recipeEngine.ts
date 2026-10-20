import type { BlandRole, EmergencyPortionPlan, IngredientDefinition, PortionLine } from '../types';
import { BLAND_MEALS_PER_DAY, BLAND_PROFILES, CARB_TO_PROTEIN, FIBER_SHARE, restingEnergyKcal, WEIGHT_RANGE_KG, type BlandProfile } from './blandDiet';
import { COOL_STEP, MISSING_CARB, MISSING_PROTEIN, servingAdvice, STORE_STEP, WEIGH_STEP } from './recipeCopy';

interface Pick {
  definition: IngredientDefinition;
  profile: BlandProfile;
}

/** The first pantry food (in BLAND_PROFILES preference order) that can fill a role. Only SAFE foods qualify. */
function pickFor(role: BlandRole, pantry: readonly IngredientDefinition[]): Pick | undefined {
  for (const [id, profile] of Object.entries(BLAND_PROFILES)) {
    if (profile.role !== role) continue;
    const definition = pantry.find((item) => item.id === id && item.tier === 'SAFE');
    if (definition) return { definition, profile };
  }
  return undefined;
}

/** Weight share of each chosen food: 2:1 carb to protein, with the fiber share taken off the top. */
function shares(hasFiber: boolean): Record<BlandRole, number> {
  const base = hasFiber ? 1 - FIBER_SHARE : 1;
  return { carb: (base * CARB_TO_PROTEIN) / (CARB_TO_PROTEIN + 1), protein: base / (CARB_TO_PROTEIN + 1), fiber: hasFiber ? FIBER_SHARE : 0 };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Bland-diet portions for a dog of `dogWeightKg` from the safe foods at hand. The day's food covers the
 * resting energy requirement, split into small meals; grams are cooked weights. Deterministic: the same
 * weight and pantry always give the same plan.
 */
export function generateEmergencyPortion(dogWeightKg: number, safePantry: readonly IngredientDefinition[]): EmergencyPortionPlan {
  if (!Number.isFinite(dogWeightKg) || dogWeightKg < WEIGHT_RANGE_KG.min || dogWeightKg > WEIGHT_RANGE_KG.max) {
    return { status: 'invalid_weight' };
  }

  const carb = pickFor('carb', safePantry);
  const protein = pickFor('protein', safePantry);
  const missingHe = [...(protein ? [] : [MISSING_PROTEIN]), ...(carb ? [] : [MISSING_CARB])];
  if (!carb || !protein) return { status: 'missing', missingHe };

  const fiber = pickFor('fiber', safePantry);
  const share = shares(!!fiber);
  const chosen = [
    { pick: carb, share: share.carb },
    { pick: protein, share: share.protein },
    ...(fiber ? [{ pick: fiber, share: share.fiber }] : []),
  ];

  // Grams per day so that the mix's energy equals the resting requirement.
  const kcalPerGram = chosen.reduce((sum, { pick, share: s }) => sum + s * pick.profile.kcalPerGram, 0);
  const dailyGrams = restingEnergyKcal(dogWeightKg) / kcalPerGram;
  const mealsPerDay = BLAND_MEALS_PER_DAY;

  const breakdownHe: PortionLine[] = chosen.map(({ pick, share: s }) => ({ item: pick.definition.nameHe, grams: Math.round((dailyGrams * s) / mealsPerDay) }));
  const instructionsHe = [...chosen.map(({ pick }) => pick.profile.stepHe), WEIGH_STEP, COOL_STEP, STORE_STEP];

  return {
    status: 'ready',
    totalMealGrams: breakdownHe.reduce((sum, line) => sum + line.grams, 0),
    mealsPerDay,
    breakdownHe,
    instructionsHe,
    recipe: {
      id: `bland-${chosen.map(({ pick }) => pick.definition.id).join('-')}`,
      titleHe: `${carb.definition.nameHe} ו${protein.definition.nameHe}`,
      ingredients: chosen.map(({ pick, share: s }) => ({ nameHe: pick.definition.nameHe, rawPortionGramsPerKg: round1((dailyGrams * s) / dogWeightKg) })),
      stepsHe: instructionsHe,
      servingAdviceHe: servingAdvice(mealsPerDay),
    },
  };
}
