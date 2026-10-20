import { mostUrgent } from '../api';
import { calculatePortion, energyFactor, lifeStage, restingEnergy } from '../nutrition';

describe('lifeStage', () => {
  it('ends growth later and starts senior earlier for bigger dogs', () => {
    expect(lifeStage(3, 'small')).toBe('young_puppy');
    expect(lifeStage(13, 'small')).toBe('adult');
    expect(lifeStage(13, 'large')).toBe('puppy');
    expect(lifeStage(17, 'giant')).toBe('puppy');
    expect(lifeStage(75, 'giant')).toBe('senior');
    expect(lifeStage(75, 'small')).toBe('adult');
    expect(lifeStage(96, 'small')).toBe('senior');
  });
});

describe('energy', () => {
  it('uses RER = 70 × kg^0.75', () => {
    expect(restingEnergy(10)).toBeCloseTo(393.6, 1);
    expect(restingEnergy(1)).toBe(70);
  });

  it('ignores activity for growing puppies', () => {
    expect(energyFactor('young_puppy', 'low')).toBe(3);
    expect(energyFactor('puppy', 'active')).toBe(2);
    expect(energyFactor('adult', 'weight_loss')).toBe(1);
    expect(energyFactor('senior', 'normal')).toBe(1.4);
  });
});

describe('calculatePortion', () => {
  it('computes a rounded daily plan split across meals', () => {
    const plan = calculatePortion({ weightKg: 10, ageMonths: 36, size: 'medium', activity: 'normal', kcalPer100g: 350, mealsPerDay: 2 });
    expect(plan.stage).toBe('adult');
    expect(plan.dailyKcal).toBe(630); // 393.6 × 1.6
    expect(plan.gramsPerDay).toBe(180);
    expect(plan.gramsPerMeal).toBe(90);
  });
});

describe('mostUrgent', () => {
  it('picks the most urgent care level', () => {
    expect(mostUrgent(['home_care', 'emergency', 'vet_visit'])).toBe('emergency');
    expect(mostUrgent(['home_care', 'vet_visit'])).toBe('vet_visit');
    expect(mostUrgent([])).toBeNull();
  });
});
