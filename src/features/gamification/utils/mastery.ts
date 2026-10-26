import type { GameState, SessionEnvironment } from '../types';

// Three-star environmental mastery. Stars are earned in order – home, then a yard or quiet park, then the
// street – because a behaviour is generalised step by step, not by jumping straight to the hardest place.

/** The mastery ladder: star 1, 2 and 3. */
export const MASTERY_LADDER: readonly SessionEnvironment[] = ['HOME_QUIET', 'YARD_LOW_DISTRACTION', 'OUTDOOR_STIMULI'];

/** Stars (0–3) for a command: consecutive ladder rungs confirmed, from the first. */
export function starsFor(state: GameState, commandId: string): number {
  const environments = new Set([...(state.mastery[commandId] ?? []), ...state.sessions.filter((session) => session.commandId === commandId).map((session) => session.environment)]);
  let stars = 0;
  for (const environment of MASTERY_LADDER) {
    if (!environments.has(environment)) break;
    stars += 1;
  }
  return stars;
}
