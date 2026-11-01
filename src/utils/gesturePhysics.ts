// Gesture math from Apple's "Designing Fluid Interfaces" (WWDC 2018): where a flick will come to rest, how
// far past an edge a drag may stretch, and whether a released sheet should close. Pure, so it is unit-tested.

/** Scroll-like deceleration per millisecond; 0.998 matches UIScrollView's normal rate. */
export const DECELERATION_RATE = 0.998;

/** How much a drag past the edge still follows the finger (UIScrollView's rubber-band constant). */
export const RUBBER_BAND_CONSTANT = 0.55;

/** Drag distance before a pan claims the gesture, so taps on buttons inside the sheet still land. */
export const DRAG_SLOP = 10;

/** Distance a gesture released at `velocity` (px/s) will still travel, using Apple's exponential-decay projection. */
export function projectMomentum(velocity: number, decelerationRate: number = DECELERATION_RATE): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** How far an element moves when dragged `overshoot` px past its bound: progressively less the further it goes. */
export function rubberBand(overshoot: number, dimension: number, constant: number = RUBBER_BAND_CONSTANT): number {
  if (dimension <= 0) return 0;
  const sign = overshoot < 0 ? -1 : 1;
  const distance = Math.abs(overshoot);
  return (sign * distance * dimension * constant) / (dimension + constant * distance);
}

/** A sheet's offset while dragging: 1:1 downward from where it was grabbed, rubber-banded above its resting place. */
export function sheetDragOffset(startOffset: number, dy: number, sheetHeight: number): number {
  const raw = startOffset + dy;
  return raw >= 0 ? raw : rubberBand(raw, sheetHeight);
}

/** Whether a released sheet closes: decided by where its momentum would carry it, not where the finger let go. */
export function shouldDismissSheet(offset: number, velocity: number, sheetHeight: number): boolean {
  if (sheetHeight <= 0) return false;
  return offset + projectMomentum(velocity) > sheetHeight / 2;
}
