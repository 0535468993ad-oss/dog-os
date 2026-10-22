import { TEMPERAMENT_PROFILES, VOLHARD_PRECONDITIONS, VOLHARD_TESTS } from '../data/volhardProfiles';
import type { PreconditionId, TemperamentProfileId, VolhardResult, VolhardScore, VolhardScores, VolhardTest } from '../types';

const ALL_SCORES: readonly VolhardScore[] = [1, 2, 3, 4, 5, 6];
/** Below this many tests sharing the top score, the litter-mate reads as a mixed profile. */
const DOMINANT_MODE_MIN = 4;
/** Midpoint between the balanced (3) and soft (4) profiles. */
const BALANCED_CENTER = 3.5;

/** Whether every pre-condition was confirmed – the test is meaningless otherwise. */
export function preconditionsMet(confirmed: readonly PreconditionId[]): boolean {
  return VOLHARD_PRECONDITIONS.every((condition) => confirmed.includes(condition.id));
}

/** Day 49 is ideal; days 48–50 are acceptable. */
export function isWithinTestWindow(ageDays: number): boolean {
  return Number.isInteger(ageDays) && ageDays >= 48 && ageDays <= 50;
}

/** Whether the score is defined for this test (touch sensitivity has no 6). */
export function isValidScore(test: VolhardTest, score: VolhardScore): boolean {
  return test.scoreDefinitionsHe[score] !== undefined;
}

/** True once all ten tests have a valid score. */
export function isComplete(scores: VolhardScores): boolean {
  return VOLHARD_TESTS.every((test) => {
    const score = scores[test.id];
    return score !== undefined && isValidScore(test, score);
  });
}

/** How many tests received each score. */
export function scoreDistribution(scores: VolhardScores): Record<VolhardScore, number> {
  const distribution: Record<VolhardScore, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const test of VOLHARD_TESTS) {
    const score = scores[test.id];
    if (score !== undefined) distribution[score] += 1;
  }
  return distribution;
}

/**
 * The profile for tied top scores. 1) The score seen in the handling-stress tests (restraint, elevation),
 * which best reflect frustration tolerance. 2) The score farthest from the balanced centre: plan for the
 * more demanding temperament. 3) The more sensitive (higher) score: under-preparing for sensitivity
 * builds fear that is hard to undo.
 */
export function breakTie(tied: readonly VolhardScore[], scores: VolhardScores): { score: VolhardScore; reasonHe: string } {
  const handling = [scores.restraint, scores.elevation];
  const inHandling = tied.filter((score) => handling.includes(score));
  if (inHandling.length === 1 && inHandling[0] !== undefined) {
    return { score: inHandling[0], reasonHe: 'ההכרעה נקבעה לפי מבחני הריסון וההרמה – המבחנים שמשקפים ויסות תסכול.' };
  }
  const pool = inHandling.length > 1 ? inHandling : [...tied];
  const distance = (score: VolhardScore) => Math.abs(score - BALANCED_CENTER);
  const farthest = Math.max(...pool.map(distance));
  const candidates = pool.filter((score) => distance(score) === farthest);
  const score = Math.max(...candidates) as VolhardScore;
  return candidates.length > 1
    ? { score, reasonHe: 'תיקו מלא – נבחר הפרופיל הרגיש יותר, כדי לא להיערך פחות מדי.' }
    : { score, reasonHe: 'ההכרעה נקבעה לטובת הפרופיל התובעני יותר – עדיף להיערך ליותר.' };
}

/** Test-specific observations worth acting on, whatever the overall profile. */
function notesFor(scores: VolhardScores): string[] {
  const notes: string[] = [];
  if (scores.restraint === 1 || scores.elevation === 1) notes.push('תגובת תסכול חזקה בריסון: חשוב להרגיל מוקדם לטיפול שיתופי (cooperative care) – במרפאה ובטיפוח.');
  if (scores.restraint === 6 || scores.elevation === 6) notes.push('קפיאה בזמן ריסון או הרמה היא תגובת עקה שקטה, לא רוגע.');
  if (scores['sound-sensitivity'] === 5) notes.push('רגישות לרעשים והתאוששות איטית: כדאי תוכנית הרגלה הדרגתית לרעשים – אזעקות, זיקוקים ורעש עירוני.');
  if (scores['sound-sensitivity'] === 6) notes.push('לא הגיב לצליל כלל – כדאי לבדוק שמיעה (BAER) לפני שמסיקים מסקנות על המזג.');
  if ((scores['sight-sensitivity'] ?? 0) >= 5 || scores.stability === 6) notes.push('חשש מגירויים חדשים: חשיפה הדרגתית ומתוגמלת לסביבה, בלי "הצפה".');
  if (scores['touch-sensitivity'] === 5) notes.push('רגישות גבוהה למגע: רתמה רכה במקום קולר, ותגמול על כל טיפול בכפות.');
  if (scores.retrieving === 3) notes.push('החזיר את החפץ לבודק – נכונות לשתף פעולה סביב משאב, מנבא טוב לאילוף.');
  if (scores.retrieving === 6) notes.push('דחף נמוך לחפצים – תגמול באוכל ובמגע יעבוד טוב יותר מצעצועים.');
  return notes;
}

/** Maps ten complete scores to one of the six temperament profiles. */
export function evaluateVolhard(scores: VolhardScores): VolhardResult {
  if (!isComplete(scores)) throw new Error('Volhard evaluation needs a valid score for all ten tests.');
  const distribution = scoreDistribution(scores);
  const top = Math.max(...ALL_SCORES.map((score) => distribution[score]));
  const tied = ALL_SCORES.filter((score) => distribution[score] === top);
  const tie = tied.length > 1 ? breakTie(tied, scores) : undefined;
  const profileId = (tie?.score ?? tied[0] ?? 3) as TemperamentProfileId;
  const mixed = top < DOMINANT_MODE_MIN;
  const notesHe = [
    ...(mixed ? ['אין ציון שחוזר ברוב המבחנים – פרופיל מעורב. קראו את ההערות לכל מבחן, ולא רק את הכותרת.'] : []),
    ...notesFor(scores),
  ];
  return { profile: TEMPERAMENT_PROFILES[profileId], distribution, mixed, tieBreakHe: tie?.reasonHe, notesHe };
}
