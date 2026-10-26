// Search text normalisation for Hebrew and Latin: case, diacritics, Hebrew points, geresh and final
// letters, so "ג׳ק ראסל", "גק ראסל" and "Jack-Russell" compare alike.

const FINAL_LETTERS: Readonly<Record<string, string>> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

/** Lower-case, unaccented, punctuation-free text with single spaces. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // Latin diacritics
    .replace(/[֑-ׇ]/g, '') // Hebrew points and cantillation
    .replace(/[׳״'"`’‘]/g, '')
    .replace(/[ךםןףץ]/g, (letter) => FINAL_LETTERS[letter] ?? letter)
    .toLowerCase()
    .replace(/[-_־.,/()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Edit distance, stopping early once it exceeds `limit` (returns limit + 1 then). */
export function boundedLevenshtein(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min((previous[j] ?? 0) + 1, (current[j - 1] ?? 0) + 1, (previous[j - 1] ?? 0) + cost);
      current.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > limit) return limit + 1;
    previous = current;
  }
  return previous[b.length] ?? limit + 1;
}
