// Who may see and record balanced content: the age floor wins over any stored choice or consent, and
// consent counts only at the current version of the rules and of each warning that applies now.
import type { TrainingPreferences } from '@/features/gamification/types';
import { EMPTY_PREFERENCES } from '@/features/gamification/utils/gameState';
import { makeAnswers } from '@/test/fixtures';
import { addDays } from '@/utils/date';

import { RISK_WARNINGS } from '../data/assessmentCopy';
import { BALANCED_RULES_VERSION } from '../data/methodology';
import type { RiskId, RiskSeverity, RiskWarning } from '../types';
import { asTrait, balancedAccess, effectiveTrack, pendingRisks, trainingContextFor } from '../utils/trackAccess';

const TODAY = '2026-10-25';
const ADULT = '2023-09-01';
const PUPPY = addDays(TODAY, -90);
const warning = (id: RiskId, version = 1, severity: RiskSeverity = 'CAUTION'): RiskWarning => ({ id, version, severity, textHe: id });
const prefs = (patch: Partial<TrainingPreferences> = {}): TrainingPreferences => ({ ...EMPTY_PREFERENCES, ...patch });
const context = (birthDate: string | null, patch: Partial<TrainingPreferences> = {}) => trainingContextFor({ birthDate, breedId: null, preferences: prefs(patch), today: TODAY });

describe('pendingRisks', () => {
  it('never asks for info notes or the floor', () => {
    expect(pendingRisks([RISK_WARNINGS.UNKNOWN_AGE, RISK_WARNINGS.PUPPY_FLOOR], {})).toEqual([]);
  });

  it('asks until the current version is confirmed, and again after a bump', () => {
    expect(pendingRisks([warning('ADOLESCENT')], {})).toHaveLength(1);
    expect(pendingRisks([warning('ADOLESCENT')], { ADOLESCENT: 1 })).toEqual([]);
    expect(pendingRisks([warning('ADOLESCENT', 2)], { ADOLESCENT: 1 })).toHaveLength(1);
  });
});

describe('balancedAccess', () => {
  const full = { rulesAckVersion: BALANCED_RULES_VERSION, acknowledgedRisks: { SENSITIVE_NERVE: 1, ADOLESCENT: 1 } };

  it('locks the floor whatever was confirmed', () => {
    expect(balancedAccess('LOCKED', [RISK_WARNINGS.PUPPY_FLOOR], full)).toBe('LOCKED');
  });

  it('needs the current rules version first (the legacy boolean counts as version 1)', () => {
    expect(balancedAccess('OPEN', [], { rulesAckVersion: 1, acknowledgedRisks: {} })).toBe('NEEDS_RULES');
    expect(balancedAccess('OPEN', [], { rulesAckVersion: null, acknowledgedRisks: {} })).toBe('NEEDS_RULES');
    expect(balancedAccess('OPEN', [], { rulesAckVersion: BALANCED_RULES_VERSION, acknowledgedRisks: {} })).toBe('GRANTED');
  });

  it('then each current warning; a reduced set stays granted', () => {
    const sensitive = [warning('SENSITIVE_NERVE', 1, 'HIGH')];
    expect(balancedAccess('ADVISED_AGAINST', sensitive, { rulesAckVersion: BALANCED_RULES_VERSION, acknowledgedRisks: {} })).toBe('NEEDS_RISKS');
    expect(balancedAccess('ADVISED_AGAINST', sensitive, full)).toBe('GRANTED');
  });
});

describe('effectiveTrack', () => {
  it('shows force-free while locked, and the stored choice otherwise', () => {
    expect(effectiveTrack('BALANCED', 'LOCKED')).toBe('FORCE_FREE');
    expect(effectiveTrack('BALANCED', 'NEEDS_RULES')).toBe('BALANCED');
    expect(effectiveTrack('FORCE_FREE', 'GRANTED')).toBe('FORCE_FREE');
  });
});

describe('trainingContextFor', () => {
  it('asks a legacy anxious adult for the reworded rules and the specific warning', () => {
    const legacy = context(ADULT, { temperament: 'ANXIOUS_SENSITIVE', balancedRulesAckVersion: 1 });
    expect(legacy.access).toBe('NEEDS_RULES');
    expect(legacy.pending.map((item) => item.id)).toEqual(['SENSITIVE_NERVE']);
    expect(context(ADULT, { temperament: 'ANXIOUS_SENSITIVE', balancedRulesAckVersion: BALANCED_RULES_VERSION }).access).toBe('NEEDS_RISKS');
  });

  it('locks a puppy despite a stored balanced choice and full consent', () => {
    const puppy = context(PUPPY, {
      temperament: 'STEADY',
      trackByCommand: { sit: 'BALANCED' },
      balancedRulesAckVersion: BALANCED_RULES_VERSION,
      acknowledgedRisks: { ADOLESCENT: 1, SENSITIVE_NERVE: 1, HIGH_AROUSAL: 1, NOVICE_TIMING: 1, FEAR_REACTIVE: 1 },
    });
    expect(puppy).toMatchObject({ gate: 'LOCKED', access: 'LOCKED', lockReasonHe: RISK_WARNINGS.PUPPY_FLOOR.textHe });
    expect(effectiveTrack('BALANCED', puppy.access)).toBe('FORCE_FREE');
  });

  it('applies the age gates with no profile at all', () => {
    expect(context(PUPPY)).toMatchObject({ recommendation: null, access: 'LOCKED' });
    expect(context(ADULT)).toMatchObject({ recommendation: null, gate: 'OPEN', access: 'NEEDS_RULES', defaultTrack: 'FORCE_FREE' });
  });

  it("prefers the assessment over the trait, and the owner's choice as the default track", () => {
    const assessed = context(ADULT, {
      temperament: 'ANXIOUS_SENSITIVE',
      assessment: { answers: makeAnswers(), completedAt: '2026-10-25T09:00:00.000Z', selectedTrack: 'BALANCED', ownerOverrodeTrack: true },
    });
    expect(assessed.recommendation?.track).toBe('FORCE_FREE');
    expect(assessed.gate).toBe('OPEN');
    expect(assessed.defaultTrack).toBe('BALANCED');
  });

  it('recomputes from the birth date, so an unknown age only adds the info note', () => {
    expect(context(null, { temperament: 'STEADY' }).warnings.map((item) => item.id)).toEqual(['UNKNOWN_AGE']);
  });
});

describe('asTrait', () => {
  it('accepts known traits only (own properties)', () => {
    expect(asTrait('STEADY')).toBe('STEADY');
    expect(asTrait('toString')).toBeNull();
    expect(asTrait(null)).toBeNull();
  });
});
