// Text normalization for food lookups, so that spelling variants match the catalog: niqqud, geresh,
// final letters, case and punctuation are all folded away.

const NIQQUD = /[֑-ׇ]/g;
const QUOTES = /[׳״'"`׳״]/g;
const FINAL_LETTERS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
// Hebrew letters, Latin letters and digits survive; everything else becomes a space.
const NOT_WORD = /[^a-z0-9א-ת]+/g;

/** Lower-cased, niqqud-free text with final letters unified and punctuation collapsed to single spaces. */
export function normalizeFoodText(text: string): string {
  return text
    .toLowerCase()
    .replace(NIQQUD, '')
    .replace(QUOTES, '')
    .replace(/[ךםןףץ]/g, (letter) => FINAL_LETTERS[letter] ?? letter)
    .replace(NOT_WORD, ' ')
    .trim();
}

/** The normalized text split into words. */
export function foodTokens(text: string): string[] {
  const normalized = normalizeFoodText(text);
  return normalized ? normalized.split(' ') : [];
}
