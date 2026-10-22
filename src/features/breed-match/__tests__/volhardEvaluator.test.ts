// The Volhard PAT engine: the ten tests, the pre-condition gate, profiles 1–6 and tie-breaking.
import { VOLHARD_PRECONDITIONS, VOLHARD_TESTS } from '../data/volhardProfiles';
import type { PreconditionId, VolhardScore, VolhardScores, VolhardTestId } from '../types';
import { breakTie, evaluateVolhard, isComplete, isValidScore, isWithinTestWindow, preconditionsMet, scoreDistribution } from '../utils/volhardEvaluator';

const IDS = VOLHARD_TESTS.map((test) => test.id);

/** Every test scored `score` (touch sensitivity tops out at 5), with optional overrides. */
function uniform(score: VolhardScore, overrides: VolhardScores = {}): VolhardScores {
  const base = Object.fromEntries(IDS.map((id) => [id, id === 'touch-sensitivity' && score === 6 ? 5 : score])) as Record<VolhardTestId, VolhardScore>;
  return { ...base, ...overrides };
}

/** Scores from a list in protocol order. */
function inOrder(scores: readonly VolhardScore[]): VolhardScores {
  return Object.fromEntries(IDS.map((id, index) => [id, scores[index]])) as VolhardScores;
}

describe('the protocol', () => {
  it('has the ten tests in order', () => {
    expect(IDS).toEqual([
      'social-attraction', 'following', 'restraint', 'social-proximity', 'elevation',
      'retrieving', 'touch-sensitivity', 'sound-sensitivity', 'sight-sensitivity', 'stability',
    ]);
    expect(VOLHARD_TESTS.map((test) => test.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('defines scores 1–6 for every test except touch sensitivity, which has five levels', () => {
    for (const test of VOLHARD_TESTS) {
      const defined = Object.keys(test.scoreDefinitionsHe).map(Number);
      expect(defined).toEqual(test.id === 'touch-sensitivity' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]);
      expect(test.instructionsHe.length).toBeGreaterThan(40);
    }
    const touch = VOLHARD_TESTS.find((test) => test.id === 'touch-sensitivity');
    expect(touch && isValidScore(touch, 6)).toBe(false);
  });

  it('never throws objects at the puppy on the sound test', () => {
    const sound = VOLHARD_TESTS.find((test) => test.id === 'sound-sensitivity');
    expect(sound?.instructionsHe).toMatch(/סיר מתכת/);
    expect(sound?.cautionHe).toMatch(/לעולם לא זורקים מפתחות/);
  });
});

describe('pre-condition gate', () => {
  const all = VOLHARD_PRECONDITIONS.map((condition) => condition.id);

  it('opens only when all four conditions are confirmed', () => {
    expect(all).toHaveLength(4);
    expect(preconditionsMet([])).toBe(false);
    expect(preconditionsMet(all.slice(0, 3))).toBe(false);
    expect(preconditionsMet(all)).toBe(true);
    expect(preconditionsMet([...all].reverse() as PreconditionId[])).toBe(true);
  });

  it('accepts days 48–50 only', () => {
    expect([47, 48, 49, 50, 51, 49.5].map(isWithinTestWindow)).toEqual([false, true, true, true, false, false]);
  });
});

describe('profiles 1–6', () => {
  it.each([1, 2, 3, 4, 5, 6] as const)('mostly %ss map to profile %s', (score) => {
    const result = evaluateVolhard(uniform(score));
    expect(result.profile.id).toBe(score);
    expect(result.mixed).toBe(false);
    expect(result.tieBreakHe).toBeUndefined();
  });

  it('reads a clear majority through a few outliers', () => {
    const result = evaluateVolhard(inOrder([3, 3, 4, 3, 3, 3, 2, 3, 5, 3]));
    expect(result.profile.id).toBe(3);
    expect(result.distribution).toEqual({ 1: 0, 2: 1, 3: 7, 4: 1, 5: 1, 6: 0 });
  });

  it('refuses incomplete or invalid scores', () => {
    expect(isComplete({ 'social-attraction': 3 })).toBe(false);
    expect(() => evaluateVolhard({ 'social-attraction': 3 })).toThrow();
    expect(() => evaluateVolhard(uniform(3, { 'touch-sensitivity': 6 }))).toThrow();
  });
});

describe('mixed scores and tie-breaking', () => {
  it('lets the restraint and elevation tests decide a tie', () => {
    // 2s and 4s four times each; restraint scored 2.
    const result = evaluateVolhard(inOrder([2, 4, 2, 4, 3, 2, 4, 2, 4, 3]));
    expect(result.profile.id).toBe(2);
    expect(result.tieBreakHe).toMatch(/הריסון וההרמה/);
  });

  it('otherwise plans for the more demanding profile', () => {
    // 3s and 5s four times each; restraint 1 and elevation 6 match neither.
    const result = evaluateVolhard(inOrder([3, 5, 1, 3, 6, 3, 5, 3, 5, 5]));
    expect(result.profile.id).toBe(5);
    expect(result.mixed).toBe(false);
  });

  it('breaks a full tie towards the more sensitive profile', () => {
    expect(breakTie([3, 4], uniform(1)).score).toBe(4);
    expect(breakTie([2, 5], { restraint: 2, elevation: 5 }).score).toBe(5);
  });

  it('marks a profile mixed when no score reaches four tests', () => {
    const result = evaluateVolhard(inOrder([1, 2, 3, 3, 3, 4, 4, 5, 5, 6]));
    expect(result.mixed).toBe(true);
    expect(result.profile.id).toBe(3);
    expect(result.notesHe[0]).toMatch(/פרופיל מעורב/);
  });

  it('adds test-specific notes', () => {
    const notes = evaluateVolhard(uniform(3, { 'sound-sensitivity': 6, restraint: 1 })).notesHe.join(' ');
    expect(notes).toMatch(/BAER/);
    expect(notes).toMatch(/cooperative care/);
    expect(scoreDistribution(uniform(3))[3]).toBe(10);
  });
});
