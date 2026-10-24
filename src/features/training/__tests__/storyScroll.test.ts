// The command story's scroll math: the focus line, per-step focus, and which step is active.
import { STORY_FOCUS_RANGE, STORY_FOCUS_RATIO, activeStepIndex, focusLineAt, stepFocus } from '../utils/storyScroll';

describe('story scroll math', () => {
  it('puts the focus line a fixed share down the viewport', () => {
    expect(focusLineAt(0, 1000)).toBe(1000 * STORY_FOCUS_RATIO);
    expect(focusLineAt(400, 1000)).toBe(400 + 1000 * STORY_FOCUS_RATIO);
  });

  it('is fully in focus on the line and fades out to zero at the range edge', () => {
    expect(stepFocus(150, 100, 100)).toBe(1);
    expect(stepFocus(150 + STORY_FOCUS_RANGE / 2, 100, 100)).toBeCloseTo(0.5);
    expect(stepFocus(150 + STORY_FOCUS_RANGE * 3, 100, 100)).toBe(0);
    expect(stepFocus(150 - STORY_FOCUS_RANGE * 3, 100, 100)).toBe(0);
  });

  it('picks the last step whose top crossed the focus line', () => {
    const tops = [100, 300, 500];
    expect(activeStepIndex(50, tops)).toBe(-1);
    expect(activeStepIndex(100, tops)).toBe(0);
    expect(activeStepIndex(450, tops)).toBe(1);
    expect(activeStepIndex(10_000, tops)).toBe(2);
  });

  it('ignores steps that have not been measured yet', () => {
    expect(activeStepIndex(10_000, [Number.NaN, Number.NaN])).toBe(-1);
    expect(activeStepIndex(10_000, [100, Number.NaN, 500])).toBe(2);
    expect(activeStepIndex(10_000, [])).toBe(-1);
  });
});
