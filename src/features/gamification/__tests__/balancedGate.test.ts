// The balanced-track invariant at the recording boundary, and the versioned consent and assessment
// fields in the synced state.
import { makeAnswers } from '@/test/fixtures';

import type { BalancedAccess, CompletionInput, SessionTrack } from '../types';
import { outcomeMessageHe } from '../utils/format';
import { EMPTY_GAME_STATE, parseGameState } from '../utils/gameState';
import { completeSession } from '../utils/integrity';

const TODAY = '2026-10-22';
const NOW = Date.parse('2026-10-22T09:00:00Z');
const input = (track: SessionTrack, balancedAccess: BalancedAccess): CompletionInput => ({
  commandId: 'sit',
  xpReward: 40,
  track,
  balancedAccess,
  environment: 'HOME_QUIET',
  startedAt: NOW - 180_000,
  now: NOW,
  today: TODAY,
  hour: 3,
  mode: 'STANDARD',
});

describe('completeSession and balanced access', () => {
  it.each(['LOCKED', 'NEEDS_RULES', 'NEEDS_RISKS'] as const)('refuses a balanced session with access %s, recording nothing', (access) => {
    const outcome = completeSession(EMPTY_GAME_STATE, input('BALANCED', access));
    expect(outcome.blocked).toBe('TRACK_NOT_ALLOWED');
    expect(outcome.state).toBe(EMPTY_GAME_STATE);
    expect(outcome.xpAwarded).toBe(0);
    expect(outcomeMessageHe(outcome)).toBe('המסלול המאוזן לא זמין כרגע לכלב הזה – האימון לא נרשם.');
  });

  it('records a granted balanced session, and a force-free session whatever the access', () => {
    expect(completeSession(EMPTY_GAME_STATE, input('BALANCED', 'GRANTED')).state.sessions.map((session) => session.track)).toEqual(['BALANCED']);
    expect(completeSession(EMPTY_GAME_STATE, input('FORCE_FREE', 'LOCKED')).state.sessions.map((session) => session.track)).toEqual(['FORCE_FREE']);
  });
});

describe('parseGameState: consent and assessment', () => {
  it('keeps only valid, upper-case risk ids with positive integer versions (no prototype keys)', () => {
    const raw = JSON.parse('{"version":1,"preferences":{"balancedRulesAckVersion":2,"acknowledgedRisks":{"__proto__":1,"SENSITIVE_NERVE":2,"adolescent":1,"HIGH_AROUSAL":0,"ADOLESCENT":1.5,"NOVICE_TIMING":-1}}}');
    const { preferences } = parseGameState(raw);
    expect(preferences.acknowledgedRisks).toEqual({ SENSITIVE_NERVE: 2 });
    expect(Object.getPrototypeOf(preferences.acknowledgedRisks)).toBe(Object.prototype);
    expect(preferences.balancedRulesAckVersion).toBe(2);
  });

  it('rejects a non-integer rules version and keeps a state without the new fields valid', () => {
    expect(parseGameState({ version: 1, preferences: { balancedRulesAckVersion: '2' } }).preferences.balancedRulesAckVersion).toBeNull();
    expect(parseGameState({ version: 1, preferences: { temperament: 'STEADY' } }).preferences).toMatchObject({ acknowledgedRisks: {}, assessment: null, balancedRulesAckVersion: null });
  });

  it('round-trips a valid assessment and drops an invalid one', () => {
    const assessment = { answers: makeAnswers(), completedAt: '2026-10-25T09:00:00.000Z', selectedTrack: 'BALANCED', ownerOverrodeTrack: true };
    const parsed = parseGameState({ version: 1, preferences: { assessment } });
    expect(parsed.preferences.assessment).toEqual(assessment);
    expect(parseGameState(JSON.parse(JSON.stringify(parsed))).preferences.assessment).toEqual(assessment);
    expect(parseGameState({ version: 1, preferences: { assessment: { ...assessment, selectedTrack: 'SHOCK' } } }).preferences.assessment).toBeNull();
  });
});
