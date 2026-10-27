// The nine-command curriculum: the TrainingCommand contract, R+ only content, the mandatory closing
// generalisation sentence, tactical gear, and the optional balanced protocol.
import { COMMAND_XP } from '@/features/gamification/data/rules';

import { TRAINING_COMMANDS } from '../data/commandsData';
import { GENERALIZATION_RULE_HE } from '../data/methodology';
import type { MasterCommandId, NerveProfile, TrainingTrack } from '../types';
import { protocolFor, troubleshootingFor } from '../utils/protocol';

const EXACT_RULE =
  'לאחר שהכלב מתרגל את הפקודה בסביבה הביתית השקטה וזה מצליח, יוצאים איתו בהדרגה לבלות ולתרגל בסביבה עם גירויים כדי להטמיע את ההתנהגות בכל תנאי.';
const TRACKS: TrainingTrack[] = ['FORCE_FREE', 'BALANCED'];
const NERVE_PROFILES: readonly NerveProfile[] = ['SENSITIVE_SOFT', 'BALANCED_STABLE', 'HARD_HIGH_DRIVE'];
// What the force-free curriculum may never say: aversive tools, corrections, leash pressure, dominance framing.
const R_PLUS_GUARD = /פרונג|קולר אלקטרוני|Slip Lead|תיקון|לחץ רצועה|אלפא|דומיננט/;

/** A command that must exist. */
function command(id: MasterCommandId) {
  const found = TRAINING_COMMANDS.find((entry) => entry.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

/** All gear for a command on a track, joined for matching. */
const gearText = (id: MasterCommandId, track: TrainingTrack = 'FORCE_FREE') =>
  protocolFor(command(id), track)
    .gear.map((item) => `${item.nameHe} ${item.noteHe ?? ''}`)
    .join(' | ');

describe('training curriculum', () => {
  it('has the nine commands in teaching order with the spec categories', () => {
    expect(TRAINING_COMMANDS.map((entry) => entry.id)).toEqual(['sit', 'down', 'stay', 'recall', 'place', 'leave-it', 'drop-it', 'heel', 'touch']);
    expect(TRAINING_COMMANDS.map((entry) => entry.category)).toEqual([
      'FOUNDATION_OBEDIENCE', 'IMPULSE_CONTROL', 'IMPULSE_CONTROL', 'LIFE_SAVING_SAFETY', 'IMPULSE_CONTROL',
      'LIFE_SAVING_SAFETY', 'LIFE_SAVING_SAFETY', 'FOUNDATION_OBEDIENCE', 'ENGAGEMENT_TARGETING',
    ]);
  });

  it.each(TRAINING_COMMANDS.map((entry) => [entry.id, entry] as const))('%s is complete and well formed', (_id, entry) => {
    expect(entry.environmentalGeneralization.endsWith(EXACT_RULE)).toBe(true);
    expect(GENERALIZATION_RULE_HE).toBe(EXACT_RULE);
    expect(entry.steps.map((step) => step.stepIndex)).toEqual(entry.steps.map((_, i) => i + 1));
    expect(entry.steps.every((step) => step.markerCue.length > 0)).toBe(true);
    expect(entry.balancedTroubleshooting.length).toBeGreaterThanOrEqual(3);
    expect(entry.steps.every((step) => step.handlerMechanics.length >= 30)).toBe(true);
    expect(entry.markers).toEqual({ terminal: 'כן!', continuation: 'טוב', releaseWord: 'חופשי' });
    expect(entry.suitableForProfiles.length).toBeGreaterThan(0);
    expect(entry.suitableForProfiles.every((profile) => NERVE_PROFILES.includes(profile))).toBe(true);
    expect(entry.balancedTroubleshooting.every((tip) => tip.highlightFor.every((profile) => NERVE_PROFILES.includes(profile)))).toBe(true);
    expect(entry.xpReward).toBe(COMMAND_XP);
    expect(entry.anxiousDogAdjustmentHe.length).toBeGreaterThan(40);
    expect(entry.anxiousDogAdjustmentHe).not.toMatch(/פרונג|קולר אלקטרוני|Slip Lead|תיקון|לחץ רצועה|אלפא|דומיננט/);
    const ids = TRAINING_COMMANDS.map((other) => other.id);
    expect(entry.prerequisites.every((id) => ids.includes(id) && id !== entry.id)).toBe(true);
  });

  it('teaches only with reward: no force, leash jerks or aversive tools in the R+ curriculum', () => {
    const text = TRAINING_COMMANDS.flatMap((entry) => [
      entry.targetGoal,
      ...entry.steps.flatMap((step) => [step.instructionHe, step.handlerMechanics]),
      ...entry.balancedTroubleshooting.flatMap((tip) => [tip.commonMistake, tip.correctionOrAdjustment]),
      ...entry.gear.map((item) => item.nameHe),
    ]).join(' ');
    expect(text).not.toMatch(R_PLUS_GUARD);
  });

  it('keeps balanced escalations to known behaviours, without tools, and none for drop it or touch', () => {
    const escalations = TRAINING_COMMANDS.flatMap((entry) => entry.balancedTroubleshooting.flatMap((tip) => (tip.balancedEscalation ? [tip.balancedEscalation] : [])));
    expect(escalations.length).toBeGreaterThanOrEqual(6);
    for (const text of escalations) {
      expect(text).toMatch(/שמכיר|מכיר את/);
      expect(text).not.toMatch(/פרונג|אלקטרוני|Slip Lead|אלפא|דומיננט/i);
    }
    for (const id of ['drop-it', 'touch'] as const) expect(command(id).balancedTroubleshooting.some((tip) => tip.balancedEscalation)).toBe(false);
  });

  it('tags troubleshooting for every nerve profile, including sensitive and driven dogs on heel and recall', () => {
    const tagged = new Set(TRAINING_COMMANDS.flatMap((entry) => entry.balancedTroubleshooting.flatMap((tip) => tip.highlightFor)));
    expect([...tagged].sort()).toEqual([...NERVE_PROFILES].sort());
    for (const id of ['heel', 'recall'] as const) {
      const profiles = command(id).balancedTroubleshooting.flatMap((tip) => tip.highlightFor);
      expect(profiles).toEqual(expect.arrayContaining(['SENSITIVE_SOFT', 'HARD_HIGH_DRIVE']));
    }
  });

  it('marks in-position steps with the continuation marker, so a hold is never released by "כן!"', () => {
    const continuation = TRAINING_COMMANDS.flatMap((entry) => entry.steps.filter((step) => step.marker === 'CONTINUATION').map((step) => `${entry.id}:${step.stepIndex}`));
    expect(continuation).toEqual(['sit:4', 'down:2', 'down:4', 'stay:1', 'stay:2', 'stay:3', 'stay:4', 'recall:3', 'place:3', 'place:4', 'heel:2']);
    // A cue that says the dog is "still" in position can only be marked with "טוב".
    for (const entry of TRAINING_COMMANDS) {
      for (const step of entry.steps) if (/עדיין|נשאר|שוכב רגוע|בכל צעד/.test(step.markerCue)) expect(`${entry.id}:${step.stepIndex}:${step.marker}`).toMatch(/CONTINUATION$/);
    }
    expect(protocolFor(command('stay'), 'FORCE_FREE').steps.map((step) => step.markerWord)).toEqual(['טוב', 'טוב', 'טוב', 'טוב']);
    expect(protocolFor(command('sit'), 'FORCE_FREE').steps.map((step) => step.markerWord)).toEqual(['כן!', 'כן!', 'כן!', 'טוב']);
  });

  it('times the reward at 1–1.5 seconds everywhere', () => {
    const text = JSON.stringify(TRAINING_COMMANDS) + protocolFor(command('sit'), 'FORCE_FREE').summaryHe;
    expect(text).not.toMatch(/1–2 שניות|1–2 s/);
    expect(text).toMatch(/1–1\.5 שניות/);
  });

  it("orders troubleshooting by the dog's profile and hides escalations unless balanced is open for a non-sensitive dog", () => {
    const tips = command('heel').balancedTroubleshooting;
    const driven = troubleshootingFor(tips, 'HARD_HIGH_DRIVE', true);
    expect(driven.map((tip) => tip.highlighted)).toEqual([true, true, false, false]);
    expect(driven.some((tip) => tip.balancedEscalation)).toBe(true);
    expect(troubleshootingFor(tips, 'HARD_HIGH_DRIVE', false).some((tip) => tip.balancedEscalation)).toBe(false);
    expect(troubleshootingFor(tips, 'SENSITIVE_SOFT', true).some((tip) => tip.balancedEscalation)).toBe(false);
    expect(troubleshootingFor(tips, null, true).map((tip) => tip.commonMistake)).toEqual(tips.map((tip) => tip.commonMistake));
  });

  it('ends both tracks with the generalisation step', () => {
    for (const entry of TRAINING_COMMANDS) {
      for (const track of TRACKS) expect(protocolFor(entry, track).generalizationHe.endsWith(EXACT_RULE)).toBe(true);
    }
  });

  it('attaches the tactical gear each command needs', () => {
    expect(gearText('recall')).toMatch(/10–15 מ׳/);
    expect(gearText('recall')).toMatch(/פאוץ׳/);
    expect(gearText('recall')).toMatch(/משרוקית/);
    expect(gearText('heel')).toMatch(/1\.5 מ׳/);
    expect(gearText('heel')).toMatch(/פלקסי\) אסורה/);
    expect(gearText('place')).toMatch(/מיטה מוגבהת/);
    expect(gearText('drop-it')).toMatch(/שני צעצועים זהים/);
    expect(gearText('leave-it')).toMatch(/צלוחית שקופה/);
  });

  it('adds balanced tools only on the balanced track, never to hand targeting', () => {
    expect(gearText('heel', 'BALANCED')).toMatch(/פרונג/);
    expect(gearText('recall', 'BALANCED')).toMatch(/קולר אלקטרוני/);
    expect(gearText('touch', 'BALANCED')).not.toMatch(/Slip|פרונג|אלקטרוני/);
  });
});
