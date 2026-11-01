import { projectMomentum, rubberBand, sheetDragOffset, shouldDismissSheet } from '../gesturePhysics';

describe('projectMomentum', () => {
  it('matches Apple’s projection for a normal scroll rate', () => {
    // (1000 / 1000) * 0.998 / 0.002 = 499
    expect(projectMomentum(1000)).toBeCloseTo(499, 6);
  });

  it('keeps the sign of the velocity and is zero at rest', () => {
    expect(projectMomentum(-500)).toBeCloseTo(-249.5, 6);
    expect(projectMomentum(0)).toBe(0);
  });

  it('travels less with a snappier deceleration rate', () => {
    expect(projectMomentum(1000, 0.99)).toBeLessThan(projectMomentum(1000));
  });
});

describe('rubberBand', () => {
  it('follows less the further it is pulled, and never reaches the full dimension', () => {
    const small = rubberBand(20, 400);
    const large = rubberBand(400, 400);
    expect(small).toBeGreaterThan(0);
    expect(small).toBeLessThan(20);
    expect(large / 400).toBeLessThan(small / 20);
    expect(rubberBand(1e6, 400)).toBeLessThan(400);
  });

  it('is symmetric and safe for an unmeasured view', () => {
    expect(rubberBand(-50, 300)).toBeCloseTo(-rubberBand(50, 300), 6);
    expect(rubberBand(50, 0)).toBe(0);
  });
});

describe('sheetDragOffset', () => {
  it('tracks the finger 1:1 below the resting place, from where the sheet was grabbed', () => {
    expect(sheetDragOffset(0, 120, 500)).toBe(120);
    expect(sheetDragOffset(80, 40, 500)).toBe(120);
  });

  it('resists above the resting place', () => {
    const offset = sheetDragOffset(0, -100, 500);
    expect(offset).toBeLessThan(0);
    expect(offset).toBeGreaterThan(-100);
  });
});

describe('shouldDismissSheet', () => {
  it('closes when dragged past half its height', () => {
    expect(shouldDismissSheet(260, 0, 500)).toBe(true);
    expect(shouldDismissSheet(200, 0, 500)).toBe(false);
  });

  it('closes on a short downward flick and stays on an upward one', () => {
    expect(shouldDismissSheet(40, 800, 500)).toBe(true);
    expect(shouldDismissSheet(300, -1200, 500)).toBe(false);
  });

  it('never closes an unmeasured sheet', () => {
    expect(shouldDismissSheet(100, 2000, 0)).toBe(false);
  });
});
