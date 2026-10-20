export type FoodCategory = 'POUCH' | 'DRY_KIBBLE' | 'SUPPLEMENT';

export type ServingUnitType = 'POUCH' | 'CUP_AND_GRAMS' | 'PUMP_OR_TABLET';

/**
 * Whether the food can be the whole diet. COMPLEMENTARY food (e.g. FEDIAF "complementary") must be
 * combined with a complete food, so the engine never sizes it as the only food. UNCONFIRMED: the maker
 * doesn't say – the portion is computed, and the owner is asked to check the pack says "complete".
 */
export type DietRole = 'COMPLETE' | 'COMPLEMENTARY' | 'UNCONFIRMED' | 'SUPPLEMENT';

/** Where a nutrition figure comes from. 'label-required': nothing published – the owner types it from the pack. */
export type SpecSource = 'manufacturer' | 'retailer' | 'label-required';

/** Breed ids from features/dogs/breeds, or a size group. */
export type BreedTag = 'german-shepherd' | 'belgian-malinois' | 'labrador' | 'golden-retriever' | 'LARGE_BREEDS' | 'ALL_BREEDS';

export interface NutritionalSpecs {
  /** Metabolizable energy as fed. null when not published (see SpecSource). */
  kcalPer100g: number | null;
  proteinPercent: number | null;
  fatPercent: number | null;
  moisturePercent: number | null;
  jointActivesMgPerKg?: number;
  omega3Percent?: number;
}

export interface FoodProduct {
  id: string;
  nameHe: string;
  nameEn: string;
  brand: string;
  category: FoodCategory;
  dietRole: DietRole;
  /** Licensed product image; null renders the branded fallback tile. */
  imageUrl: string | null;
  packageSize: string;
  /** Estimated shelf price; `avg` is the midpoint of the range. */
  priceRangeILS: { min: number; max: number; avg: number };
  servingUnitType: ServingUnitType;
  /** Weight of one unit: a pouch, a level measuring cup of this kibble, or one pump/tablet when known. */
  unitWeightGrams: number | null;
  nutritionalSpecs: NutritionalSpecs;
  specSource: SpecSource;
  /** Where the specs were read (retailer or manufacturer page), for review. */
  specReference?: string;
  breedRecommendation: BreedTag[];
  highlightBenefitHe: string;
  /** Supplements: how the label doses it (the app never invents a dose). */
  labelDosingHe?: string;
}

export type ActivityLevel = 'low' | 'normal' | 'active';

export interface DogNutritionProfile {
  name: string;
  weightKg: number;
  ageMonths: number;
  breedId: string | null;
  isLargeBreed: boolean;
  activity: ActivityLevel;
}

export interface EnergyBudget {
  restingKcal: number;
  dailyKcal: number;
  /** Calories kept for training rewards. */
  treatKcal: number;
  /** Calories left for the bowl. */
  bowlKcal: number;
  treatSharePercent: number;
}

export type ServingPlan =
  | { status: 'ready'; headlineHe: string; detailHe: string; dailyGrams: number; unitsPerDay: number; noteHe?: string }
  | { status: 'needs_label_kcal' }
  | { status: 'complementary_only' }
  | { status: 'supplement'; labelDosingHe: string; omega3TargetHe?: string }
  | { status: 'unsupported_age'; reasonHe: string };

export interface BreedAdvice {
  titleHe: string;
  alertsHe: string[];
  adviceHe: string[];
  recommendedProductIds: string[];
}

export type CatalogFilter = 'ALL' | FoodCategory;
