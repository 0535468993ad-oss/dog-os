// Scroll math for the command story. Worklets, so the UI thread runs them on every scroll frame; plain
// functions everywhere else, which keeps them testable without Reanimated.

/** How far from the focus line a step still counts as partly in focus, in points. */
export const STORY_FOCUS_RANGE = 220;
/** The focus line sits this far down the visible area (0 = top, 1 = bottom). */
export const STORY_FOCUS_RATIO = 0.35;

/** Where the focus line is in content coordinates for a scroll offset and viewport height. */
export function focusLineAt(scrollY: number, viewportHeight: number): number {
  'worklet';
  return scrollY + viewportHeight * STORY_FOCUS_RATIO;
}

/** 1 when a step's centre sits on the focus line, falling linearly to 0 at STORY_FOCUS_RANGE away. */
export function stepFocus(focusLine: number, top: number, height: number): number {
  'worklet';
  const distance = Math.abs(top + height / 2 - focusLine);
  return Math.max(0, 1 - distance / STORY_FOCUS_RANGE);
}

/**
 * The step the reader is on: the last one whose top has crossed the focus line. -1 before the first
 * step, or while no step has been measured (a top of NaN is unmeasured and never counts).
 */
export function activeStepIndex(focusLine: number, tops: readonly number[]): number {
  'worklet';
  let active = -1;
  for (let i = 0; i < tops.length; i += 1) {
    const top = tops[i];
    if (top !== undefined && !Number.isNaN(top) && top <= focusLine) active = i;
  }
  return active;
}
