/** How safe a food is for dogs. TOXIC is absolute; CAUTION means "only with conditions" or "unknown". */
export type SafetyTier = 'SAFE' | 'TOXIC' | 'CAUTION';

/** OTHER covers drinks, sweeteners and additives that are none of the four food groups. */
export type FoodCategory = 'PROTEIN' | 'CARB' | 'VEGGIE' | 'FAT_SUPPLEMENT' | 'OTHER';

export interface IngredientDefinition {
  id: string;
  nameHe: string;
  tier: SafetyTier;
  category: FoodCategory;
  /** Names that identify the food, in Hebrew and English (matched after normalization, see utils/normalize). */
  aliases: readonly string[];
  /** How to serve it safely – or, for toxic foods, that it must not be served at all. */
  preparationRulesHe: string;
  /** Why it is dangerous (toxic foods) or what the condition guards against (caution foods). */
  dangerDetailsHe?: string;
}

/** Result of looking up one food by name. `definition` is absent when the food isn't in the catalog. */
export interface FoodSafetyResult {
  tier: SafetyTier;
  feedbackHe: string;
  definition?: IngredientDefinition;
}

/** Pantry items sorted by tier; `unknown` holds entries that match nothing (never treated as safe). */
export interface PantryReport {
  safe: IngredientDefinition[];
  toxic: IngredientDefinition[];
  caution: IngredientDefinition[];
  unknown: string[];
}

export interface EmergencyMealRecipe {
  id: string;
  titleHe: string;
  /** Grams per kg of body weight per day, weighed after cooking. */
  ingredients: { nameHe: string; rawPortionGramsPerKg: number }[];
  stepsHe: string[];
  servingAdviceHe: string;
}

/** One line of the per-meal breakdown. */
export interface PortionLine {
  item: string;
  grams: number;
}

/** Bland-diet roles: the carb and protein are required; the fiber vegetable is an optional addition. */
export type BlandRole = 'carb' | 'protein' | 'fiber';

export type EmergencyPortionPlan =
  | {
      status: 'ready';
      /** Grams per meal (cooked weight), the sum of the breakdown. */
      totalMealGrams: number;
      mealsPerDay: number;
      breakdownHe: PortionLine[];
      instructionsHe: string[];
      recipe: EmergencyMealRecipe;
    }
  | { status: 'invalid_weight' }
  | { status: 'missing'; missingHe: string[] };
