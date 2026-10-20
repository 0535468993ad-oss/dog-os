// Zero-tolerance safety engine: every toxic food is caught in every form someone might type it, a toxic
// food anywhere in the query wins, and nothing unknown is ever called safe.
import { CAUTION_FOODS, FOOD_CATALOG, PANTRY_ITEM_IDS, SAFE_FOODS, TOXIC_FOODS, findIngredient } from '../utils/catalog';
import { normalizeFoodText } from '../utils/normalize';
import { checkFoodSafety, toxicFoodsIn, validatePantryList } from '../utils/safety';

const toxicAliases = TOXIC_FOODS.flatMap((food) => food.aliases.map((alias) => [alias, food.id] as const));

describe('checkFoodSafety – every toxic alias', () => {
  it.each(toxicAliases)('%s → TOXIC (%s)', (alias, id) => {
    const result = checkFoodSafety(alias);
    expect(result.tier).toBe('TOXIC');
    expect(result.definition?.id).toBe(id);
  });

  it.each(TOXIC_FOODS.map((food) => [food.nameHe, food.id] as const))('display name %s → TOXIC (%s)', (name, id) => {
    expect(checkFoodSafety(name)).toMatchObject({ tier: 'TOXIC', definition: { id } });
  });
});

describe('checkFoodSafety – toxic foods in the forms people type', () => {
  it.each([
    // Plurals, construct forms and attached prefixes (ו, ה, ב, ל, מ, ש, כ)
    ['בצלים', 'onion'],
    ['והבצל', 'onion'],
    ['בשום', 'garlic'],
    ['שוקולדים', 'chocolate'],
    ['הענבים', 'grapes'],
    ['ענבים', 'grapes'],
    ['צימוקים', 'raisins'],
    ['עצמות', 'cooked-bones'],
    ['העצמות', 'cooked-bones'],
    ['מסטיקים', 'xylitol'],
    ['ממתיקים מלאכותיים', 'xylitol'],
    ['יינות', 'alcohol'],
    ['כרישות', 'leek'],
    // Inside a dish or next to a safe food
    ['עוגת שוקולד', 'chocolate'],
    ['לחם שום', 'garlic'],
    ['מיץ ענבים', 'grapes'],
    ['אורז עם בצל', 'onion'],
    ['עוף עם עצמות', 'cooked-bones'],
    ['עצמות עוף מבושלות', 'cooked-bones'],
    ['עוגיות צימוקים', 'raisins'],
    ['מסטיק ללא סוכר', 'xylitol'],
    ['חמאת בוטנים ללא סוכר', 'xylitol'],
    ['תה ירוק', 'tea'],
    ['כוס יין', 'alcohol'],
    ['בצק שמרים חי', 'yeast-dough'],
    ['אגוזי מקדמיה', 'macadamia'],
    ['אגוז מוסקט', 'nutmeg'],
    ['אבקת קקאו', 'cocoa'],
    // Spelling variants: niqqud, geresh, case, punctuation, English
    ['בָּצָל', 'onion'],
    ['שׁוּם!', 'garlic'],
    ['Dark Chocolate', 'chocolate'],
    ['GRAPES', 'grapes'],
    ['onion rings', 'onion'],
    ['raisins', 'raisins'],
    ['xylitol gum', 'xylitol'],
    ['green tea', 'tea'],
    ['avocado toast', 'avocado'],
    ['chicken bones', 'cooked-bones'],
    // Partial typing (3+ letters, single word)
    ['צימו', 'raisins'],
    ['אבוק', 'avocado'],
    ['מקדמ', 'macadamia'],
    ['קסילי', 'xylitol'],
    ['chocol', 'chocolate'],
  ])('%s → TOXIC (%s)', (query, id) => {
    expect(toxicFoodsIn(query).map((food) => food.id)).toContain(id);
    expect(checkFoodSafety(query).tier).toBe('TOXIC');
  });

  it('reports every toxic food in a dish, not only the first', () => {
    expect(toxicFoodsIn('עוגת שוקולד עם צימוקים ואגוזי מקדמיה').map((food) => food.id).sort()).toEqual(['chocolate', 'macadamia', 'raisins']);
  });

  it('explains the hazard and what to do if the dog already ate it', () => {
    const { feedbackHe } = checkFoodSafety('ענבים');
    expect(feedbackHe).toContain('לא לתת');
    expect(feedbackHe).toContain('כליות');
    expect(feedbackHe).toContain('לווטרינר');
  });
});

describe('checkFoodSafety – no false toxic matches on look-alike words', () => {
  it.each([
    ['שומן', 'fatty-meat'], // fat, not garlic (שום)
    ['תפוח אדמה', 'potato'], // potato, not apple
    ['פיתה', 'bread'], // not tea (תה)
    ['עוף', 'chicken-breast'],
    ['גבינת קוטג׳', 'cottage'],
  ])('%s → %s, not toxic', (query, id) => {
    const result = checkFoodSafety(query);
    expect(result.tier).not.toBe('TOXIC');
    expect(result.definition?.id).toBe(id);
  });

  it.each(['שומשום', 'בצלאל', 'steak', 'grapefruit', 'team'])('%s is not mistaken for a toxic food', (query) => {
    expect(toxicFoodsIn(query)).toEqual([]);
  });

  it.each([...SAFE_FOODS, ...CAUTION_FOODS].flatMap((food) => food.aliases))('safe/caution alias %s never reads as toxic', (alias) => {
    expect(checkFoodSafety(alias).tier).not.toBe('TOXIC');
  });
});

describe('checkFoodSafety – unknown and empty input', () => {
  it.each(['קיווי', 'something odd', '???'])('%s is CAUTION, never SAFE', (query) => {
    const result = checkFoodSafety(query);
    expect(result.tier).toBe('CAUTION');
    expect(result.definition).toBeUndefined();
  });

  it('asks for a food name when the query is empty', () => {
    const result = checkFoodSafety('   ');
    expect(result.tier).toBe('CAUTION');
    expect(result.definition).toBeUndefined();
  });

  it('calls safe foods safe, with their preparation rule', () => {
    const result = checkFoodSafety('אורז');
    expect(result).toMatchObject({ tier: 'SAFE', definition: { id: 'white-rice' } });
    expect(result.feedbackHe).toContain('בלי מלח');
  });
});

describe('validatePantryList', () => {
  it('sorts catalog ids into tiers, once each', () => {
    const report = validatePantryList(['white-rice', 'onion', 'tuna', 'white-rice', 'chicken-breast']);
    expect(report.safe.map((food) => food.id)).toEqual(['white-rice', 'chicken-breast']);
    expect(report.toxic.map((food) => food.id)).toEqual(['onion']);
    expect(report.caution.map((food) => food.id)).toEqual(['tuna']);
    expect(report.unknown).toEqual([]);
  });

  it('catches every toxic food in free text, and keeps unknown text out of the safe list', () => {
    const report = validatePantryList(['עוגת שוקולד עם צימוקים', 'קיווי', '  ', 'אורז']);
    expect(report.toxic.map((food) => food.id).sort()).toEqual(['chocolate', 'raisins']);
    expect(report.safe.map((food) => food.id)).toEqual(['white-rice']);
    expect(report.unknown).toEqual(['קיווי']);
  });
});

describe('catalog integrity', () => {
  it('has unique ids and aliases that survive normalization', () => {
    const ids = FOOD_CATALOG.map((food) => food.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const food of FOOD_CATALOG) for (const alias of food.aliases) expect(normalizeFoodText(alias)).not.toBe('');
  });

  it('explains every toxic food', () => {
    for (const food of TOXIC_FOODS) expect(food.dangerDetailsHe?.length).toBeGreaterThan(20);
  });

  it('covers the required blacklist', () => {
    const required = ['onion', 'garlic', 'chives', 'leek', 'chocolate', 'cocoa', 'coffee', 'tea', 'grapes', 'raisins', 'xylitol', 'avocado', 'cooked-bones', 'macadamia', 'yeast-dough', 'alcohol', 'nutmeg'];
    expect(TOXIC_FOODS.map((food) => food.id).sort()).toEqual(required.sort());
  });

  it('offers only catalog foods in the pantry selector', () => {
    for (const id of PANTRY_ITEM_IDS) expect(findIngredient(id)).toBeDefined();
  });
});
