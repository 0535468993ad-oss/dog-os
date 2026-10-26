// The weekly league: five tiers and the computer-generated rivals. The rivals are not real users, and
// the league card says so – they set a pace to train against.

export const LEAGUE_TIERS: readonly { nameHe: string; rivalBaseXp: number }[] = [
  { nameHe: 'ארד', rivalBaseXp: 250 },
  { nameHe: 'כסף', rivalBaseXp: 450 },
  { nameHe: 'זהב', rivalBaseXp: 700 },
  { nameHe: 'יהלום', rivalBaseXp: 950 },
  { nameHe: 'ליגת העילית', rivalBaseXp: 1200 },
];

export const LEAGUE_RIVALS: readonly { id: string; nameHe: string }[] = [
  { id: 'rocky', nameHe: 'רוקי (מלינואה)' },
  { id: 'nela', nameHe: 'נלה (בורדר קולי)' },
  { id: 'max', nameHe: 'מקס (רועה הולנדי)' },
  { id: 'luna', nameHe: 'לונה (לברדור)' },
  { id: 'simba', nameHe: 'סימבה (כנעני)' },
  { id: 'bella', nameHe: 'בלה (גולדן)' },
  { id: 'toby', nameHe: 'טובי (ביגל)' },
  { id: 'kira', nameHe: 'קירה (האסקי)' },
  { id: 'charlie', nameHe: 'צ׳רלי (פודל)' },
];

/** Places 1–3 move up a tier at the end of the week; the last two move down. */
export const PROMOTION_PLACES = 3;
export const DEMOTION_PLACES = 2;
