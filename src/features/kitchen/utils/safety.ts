import type { FoodSafetyResult, IngredientDefinition, PantryReport, SafetyTier } from '../types';
import { FOOD_CATALOG, findIngredient } from './catalog';
import { aliasMatch } from './matching';
import { foodTokens } from './normalize';

interface IndexedEntry {
  definition: IngredientDefinition;
  aliasTokens: string[][];
}

// Aliases are normalized once, with the same function that normalizes queries.
const INDEX: IndexedEntry[] = FOOD_CATALOG.map((definition) => ({
  definition,
  aliasTokens: definition.aliases.map(foodTokens).filter((tokens) => tokens.length > 0),
}));

/**
 * How specific the best matching alias is, or 0 when nothing matches: whole-phrase matches outrank
 * partial ones, then more words, then more letters.
 */
function matchScore(entry: IndexedEntry, queryTokens: string[]): number {
  return entry.aliasTokens.reduce((best, tokens) => {
    const kind = aliasMatch(queryTokens, tokens);
    if (!kind) return best;
    const specificity = tokens.length * 100 + tokens.join('').length;
    return Math.max(best, kind === 'phrase' ? 10_000 + specificity : specificity);
  }, 0);
}

/** All catalog entries the query mentions, most specific first (catalog order breaks ties). */
function matchesFor(query: string): IndexedEntry[] {
  const tokens = foodTokens(query);
  if (tokens.length === 0) return [];
  return INDEX.map((entry) => ({ entry, score: matchScore(entry, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => entry);
}

const IF_EATEN = 'אם הכלב כבר אכל מזה – מתקשרים עכשיו לווטרינר או למרפאת חירום, גם אם הוא נראה בסדר.';

/** The user-facing sentence for a matched food. Phrased without adjectives, which would need gender agreement. */
function feedbackFor(definition: IngredientDefinition): string {
  switch (definition.tier) {
    case 'TOXIC':
      return `לא לתת! ${definition.nameHe} – סכנה לכלבים. ${definition.dangerDetailsHe ?? ''} ${IF_EATEN}`.replace(/\s+/g, ' ').trim();
    case 'CAUTION':
      return `${definition.nameHe} – רק בזהירות. ${definition.preparationRulesHe}`;
    case 'SAFE':
      return `${definition.nameHe} – אפשר לתת. ${definition.preparationRulesHe}`;
  }
}

const UNKNOWN_FEEDBACK = 'המזון הזה לא מופיע אצלנו ברשימה, אז ליתר ביטחון לא נותנים אותו עד שבודקים עם הווטרינר.';
const EMPTY_FEEDBACK = 'כתבו שם של מזון, ונבדוק יחד אם הוא מתאים לכלב.';

/**
 * Safety verdict for a typed food name. Zero tolerance: if the query mentions any toxic food – even
 * inside a dish ("עוגת שוקולד") or with a safe one ("אורז עם בצל") – the verdict is TOXIC. A food that
 * isn't in the catalog is CAUTION, never SAFE.
 */
export function checkFoodSafety(query: string): FoodSafetyResult {
  if (foodTokens(query).length === 0) return { tier: 'CAUTION', feedbackHe: EMPTY_FEEDBACK };
  const matches = matchesFor(query).map((entry) => entry.definition);
  // Toxic wins over everything; otherwise caution wins a tie with safe (both are equally specific).
  const definition = matches.find((match) => match.tier === 'TOXIC') ?? matches[0];
  if (!definition) return { tier: 'CAUTION', feedbackHe: UNKNOWN_FEEDBACK };
  return { tier: definition.tier, feedbackHe: feedbackFor(definition), definition };
}

/** The toxic foods a query mentions (all of them, not just the first). */
export function toxicFoodsIn(query: string): IngredientDefinition[] {
  return matchesFor(query)
    .map((entry) => entry.definition)
    .filter((definition) => definition.tier === 'TOXIC');
}

const BUCKET: Record<SafetyTier, keyof Omit<PantryReport, 'unknown'>> = { SAFE: 'safe', TOXIC: 'toxic', CAUTION: 'caution' };

/**
 * Sorts pantry items (catalog ids or free text) by tier. Each food appears once. Free text that mentions
 * several foods contributes every toxic one; text that matches nothing goes to `unknown`.
 */
export function validatePantryList(selectedItems: readonly string[]): PantryReport {
  const report: PantryReport = { safe: [], toxic: [], caution: [], unknown: [] };
  const seen = new Set<string>();
  const add = (definition: IngredientDefinition) => {
    if (seen.has(definition.id)) return;
    seen.add(definition.id);
    report[BUCKET[definition.tier]].push(definition);
  };

  for (const item of selectedItems) {
    const byId = findIngredient(item);
    if (byId) {
      add(byId);
      continue;
    }
    const toxic = toxicFoodsIn(item);
    const { definition } = checkFoodSafety(item);
    if (toxic.length) toxic.forEach(add);
    else if (definition) add(definition);
    else if (item.trim()) report.unknown.push(item.trim());
  }
  return report;
}
