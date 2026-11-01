// Spring tokens, designed the way Apple tunes springs: `response` (seconds to reach the target; not a
// duration – the settle time emerges) and `dampingRatio` (1 = critically damped, no overshoot; < 1 bounces).
// Reanimated takes raw physics, so each token is converted once here. Springs start from the live value and
// carry velocity when retargeted, so every animation built on them can be interrupted mid-flight.

export interface SpringPhysics {
  readonly mass: number;
  readonly stiffness: number;
  readonly damping: number;
}

export type SpringToken = 'press' | 'release' | 'ui' | 'move' | 'momentum';

/** Converts Apple's response + damping ratio into the mass/stiffness/damping Reanimated expects (mass 1). */
export function springFromResponse(response: number, dampingRatio: number): SpringPhysics {
  if (!(response > 0) || !(dampingRatio > 0)) {
    throw new RangeError('response and dampingRatio must be positive');
  }
  const stiffness = (2 * Math.PI / response) ** 2;
  const damping = (4 * Math.PI * dampingRatio) / response;
  return { mass: 1, stiffness, damping };
}

/** Damping ratio of a physics config: damping / (2·√(stiffness·mass)). Used to check the tokens never bounce by accident. */
export function dampingRatioOf({ mass, stiffness, damping }: SpringPhysics): number {
  return damping / (2 * Math.sqrt(stiffness * mass));
}

// Bounce is reserved for motion the user threw (a flick or a drag release); a menu or a press never overshoots.
const SPRING_DESIGN: Readonly<Record<SpringToken, { response: number; dampingRatio: number }>> = {
  press: { response: 0.12, dampingRatio: 1 }, // touch-down: feedback has to feel instant
  release: { response: 0.3, dampingRatio: 1 },
  ui: { response: 0.35, dampingRatio: 1 }, // state changes and entrances
  move: { response: 0.4, dampingRatio: 1 }, // repositioning
  momentum: { response: 0.3, dampingRatio: 0.8 }, // only after a gesture that carried velocity
};

/** The app's spring presets, ready for `withSpring` and layout-animation builders. */
export const SPRINGS: Readonly<Record<SpringToken, SpringPhysics>> = {
  press: springFromResponse(SPRING_DESIGN.press.response, SPRING_DESIGN.press.dampingRatio),
  release: springFromResponse(SPRING_DESIGN.release.response, SPRING_DESIGN.release.dampingRatio),
  ui: springFromResponse(SPRING_DESIGN.ui.response, SPRING_DESIGN.ui.dampingRatio),
  move: springFromResponse(SPRING_DESIGN.move.response, SPRING_DESIGN.move.dampingRatio),
  momentum: springFromResponse(SPRING_DESIGN.momentum.response, SPRING_DESIGN.momentum.dampingRatio),
};
