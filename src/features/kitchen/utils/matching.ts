// Word-level matching of a typed query against one catalog alias. Hebrew attaches prefixes (ו, ה, ב, ל,
// מ, ש, כ) and plural/construct suffixes to the word, so "והבצלים" must still match "בצל" – while "שומן"
// (fat) or "שומשום" (sesame) must not match "שום" (garlic).

const HEBREW_PREFIXES = new Set(['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ']);
// In normalized form: the plural ים is stored as ימ, because normalization unifies final letters.
const SUFFIXES = new Set(['', 'ימ', 'ות', 'י', 'ה', 'ת', 'יות', 'יה', 'ית', 's', 'es']);
/** A query this short is too ambiguous to treat as the start of a longer word. */
const MIN_PARTIAL_LENGTH = 3;

const isHebrew = (word: string) => /[א-ת]/.test(word);

/** The token itself plus the token with up to two leading Hebrew prefix letters removed. */
function withoutPrefixes(token: string): string[] {
  const forms = [token];
  let rest = token;
  for (let i = 0; i < 2 && rest.length > 2 && HEBREW_PREFIXES.has(rest[0] ?? ''); i += 1) {
    rest = rest.slice(1);
    forms.push(rest);
  }
  return forms;
}

/** Feminine plural replaces a final ה: כרישה → כרישות. */
const FEMININE_PLURALS = new Set(['ות', 'ת']);

/** Whether a query word is the alias word, possibly with a prefix and/or an inflection suffix. */
export function wordMatches(token: string, word: string): boolean {
  const forms = isHebrew(word) ? withoutPrefixes(token) : [token];
  const stem = isHebrew(word) && word.endsWith('ה') && word.length > 2 ? word.slice(0, -1) : null;
  return forms.some(
    (form) =>
      (form.startsWith(word) && SUFFIXES.has(form.slice(word.length))) ||
      (stem !== null && form.startsWith(stem) && FEMININE_PLURALS.has(form.slice(stem.length))),
  );
}

export type AliasMatch = 'phrase' | 'partial';

/**
 * How the query mentions the alias: 'phrase' when the query tokens contain the alias tokens in a row,
 * 'partial' when a single-word query is the start of the alias (someone still typing: "שוקו" → "שוקולד").
 */
export function aliasMatch(queryTokens: readonly string[], aliasTokens: readonly string[]): AliasMatch | null {
  if (aliasTokens.length === 0) return null;
  for (let start = 0; start + aliasTokens.length <= queryTokens.length; start += 1) {
    if (aliasTokens.every((word, offset) => wordMatches(queryTokens[start + offset] ?? '', word))) return 'phrase';
  }
  const [only] = queryTokens;
  const [first] = aliasTokens;
  const partial = queryTokens.length === 1 && !!only && !!first && only.length >= MIN_PARTIAL_LENGTH && first.startsWith(only);
  return partial ? 'partial' : null;
}
