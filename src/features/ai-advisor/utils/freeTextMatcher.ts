// Stricter matching than the kitchen lookup, for free chat text. A chat sentence is full of ordinary
// words that happen to start with a short alias – בעצם, משום, שתה – so short aliases only accept the
// article/conjunction prefixes and a plural ending, and only whole phrases count (no "still typing" match).
import { wordMatches } from '@/features/kitchen/utils/matching';
import { foodTokens } from '@/features/kitchen/utils/normalize';

/** Aliases this short are common substrings of unrelated Hebrew words. */
const SHORT_ALIAS_LENGTH = 3;
const SHORT_PREFIXES = ['ה', 'ו', 'וה'];
// Normalized form: ים is stored as ימ, because normalization unifies final letters.
const SHORT_SUFFIXES = ['', 'ימ', 'ות'];

function shortWordMatches(token: string, word: string): boolean {
  const forms = [token, ...SHORT_PREFIXES.filter((prefix) => token.startsWith(prefix)).map((prefix) => token.slice(prefix.length))];
  return forms.some((form) => SHORT_SUFFIXES.some((suffix) => form === word + suffix));
}

function tokenMatches(token: string, word: string): boolean {
  return word.length <= SHORT_ALIAS_LENGTH ? shortWordMatches(token, word) : wordMatches(token, word);
}

/** Whether the alias appears in the tokens as consecutive words. */
function containsPhrase(tokens: readonly string[], aliasTokens: readonly string[]): boolean {
  if (aliasTokens.length === 0) return false;
  for (let start = 0; start + aliasTokens.length <= tokens.length; start += 1) {
    if (aliasTokens.every((word, offset) => tokenMatches(tokens[start + offset] ?? '', word))) return true;
  }
  return false;
}

/** Whether the message mentions any of the aliases. */
export function mentionsAny(message: string, aliases: readonly string[]): boolean {
  const tokens = foodTokens(message);
  return tokens.length > 0 && aliases.some((alias) => containsPhrase(tokens, foodTokens(alias)));
}
