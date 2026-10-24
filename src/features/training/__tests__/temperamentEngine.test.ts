// The temperament-adaptive engine: anxious dogs and puppies stay force-free; adult high-arousal dogs
// get the balanced track with a trainer.
import { breedNoteFor, recommendTraining } from '../utils/temperamentEngine';

const JACKSON = { ageMonths: 36, breedId: 'german-shepherd' };

describe('recommendTraining', () => {
  it('keeps an anxious dog on R+ with quiet structure, and locks the balanced track', () => {
    const rec = recommendTraining({ ...JACKSON, trait: 'ANXIOUS_SENSITIVE' });
    expect(rec.track).toBe('FORCE_FREE');
    expect(rec.balancedAllowed).toBe(false);
    const principles = rec.principlesHe.join(' ');
    expect(principles).toMatch(/Spatial Pressure/);
    expect(principles).toMatch(/גבולות יציבים/);
    expect(principles).toMatch(/בלי טלטול רצועה/);
  });

  it('recommends the balanced track for Jackson with high arousal, with a professional', () => {
    const rec = recommendTraining({ ...JACKSON, trait: 'HIGH_AROUSAL_PREY' });
    expect(rec).toMatchObject({ track: 'BALANCED', balancedAllowed: true, requiresProfessional: true });
    expect(rec.reasonsHe.join(' ')).toMatch(/גזע עבודה/);
  });

  it('keeps a high-arousal puppy force-free until 12 months', () => {
    const rec = recommendTraining({ trait: 'HIGH_AROUSAL_PREY', ageMonths: 8, breedId: 'belgian-malinois' });
    expect(rec.track).toBe('FORCE_FREE');
    expect(rec.balancedAllowed).toBe(false);
    expect(rec.principlesHe.join(' ')).toMatch(/שליטה עצמית/);
  });

  it('defaults a steady adult to R+, leaving the balanced track available', () => {
    const rec = recommendTraining({ ...JACKSON, trait: 'STEADY' });
    expect(rec).toMatchObject({ track: 'FORCE_FREE', balancedAllowed: true, requiresProfessional: false });
  });

  it('treats an unknown age as adult, and an anxious dog of unknown age as anxious', () => {
    expect(recommendTraining({ trait: 'HIGH_AROUSAL_PREY', ageMonths: null, breedId: null }).track).toBe('BALANCED');
    expect(recommendTraining({ trait: 'ANXIOUS_SENSITIVE', ageMonths: null, breedId: null }).balancedAllowed).toBe(false);
  });

  it('never uses dominance language', () => {
    const all = (['ANXIOUS_SENSITIVE', 'STEADY', 'HIGH_AROUSAL_PREY'] as const).flatMap((trait) => {
      const rec = recommendTraining({ ...JACKSON, trait });
      return [rec.titleHe, ...rec.reasonsHe, ...rec.principlesHe];
    });
    expect(all.filter((text) => /דומיננט|אלפא/.test(text))).toEqual([]);
  });
});

describe('breedNoteFor', () => {
  it('notes working breeds only, and the recommendation carries the same note', () => {
    const note = breedNoteFor('german-shepherd');
    expect(note).toMatch(/^גזע עבודה:/);
    expect(breedNoteFor('beagle')).toBeNull();
    expect(breedNoteFor(null)).toBeNull();
    expect(recommendTraining({ ...JACKSON, trait: 'STEADY' }).reasonsHe).toContain(note);
  });
});
