import { dampingRatioOf, springFromResponse, SPRINGS, type SpringToken } from '../motion';

describe('springFromResponse', () => {
  it('gives a critically damped spring for a damping ratio of 1', () => {
    const spring = springFromResponse(0.4, 1);
    expect(spring.mass).toBe(1);
    expect(spring.stiffness).toBeCloseTo((2 * Math.PI / 0.4) ** 2, 6);
    expect(dampingRatioOf(spring)).toBeCloseTo(1, 6);
  });

  it('round-trips any damping ratio', () => {
    for (const ratio of [0.5, 0.8, 1, 1.2]) {
      expect(dampingRatioOf(springFromResponse(0.3, ratio))).toBeCloseTo(ratio, 6);
    }
  });

  it('gets stiffer as the response gets quicker', () => {
    expect(springFromResponse(0.12, 1).stiffness).toBeGreaterThan(springFromResponse(0.4, 1).stiffness);
  });

  it.each([
    [0, 1],
    [-0.3, 1],
    [0.3, 0],
    [Number.NaN, 1],
  ])('rejects response %p with damping ratio %p', (response, ratio) => {
    expect(() => springFromResponse(response, ratio)).toThrow(RangeError);
  });
});

describe('SPRINGS', () => {
  const tokens = Object.keys(SPRINGS) as SpringToken[];

  it('never overshoots except for momentum', () => {
    for (const token of tokens) {
      const ratio = dampingRatioOf(SPRINGS[token]);
      if (token === 'momentum') expect(ratio).toBeCloseTo(0.8, 6);
      else expect(ratio).toBeCloseTo(1, 6);
    }
  });

  it('makes touch-down quicker than release', () => {
    expect(SPRINGS.press.stiffness).toBeGreaterThan(SPRINGS.release.stiffness);
  });
});
