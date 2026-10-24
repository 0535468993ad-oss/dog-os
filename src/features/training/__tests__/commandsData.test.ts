// The nine-command curriculum: the TrainingCommand contract, R+ only content, the mandatory closing
// generalisation sentence, tactical gear, and the optional balanced protocol.
import { COMMAND_XP } from '@/features/gamification/data/rules';

import { TRAINING_COMMANDS } from '../data/commandsData';
import { GENERALIZATION_RULE_HE } from '../data/methodology';
import type { MasterCommandId, TrainingTrack } from '../types';
import { protocolFor } from '../utils/protocol';

const EXACT_RULE =
  'לאחר שהכלב מתרגל את הפקודה בסביבה הביתית השקטה וזה מצליח, יוצאים איתו בהדרגה לבלות ולתרגל בסביבה עם גירויים כדי להטמיע את ההתנהגות בכל תנאי.';
const TRACKS: TrainingTrack[] = ['FORCE_FREE', 'BALANCED'];

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
    expect(entry.commonMistakes.length).toBeGreaterThanOrEqual(3);
    expect(entry.xpReward).toBe(COMMAND_XP);
    expect(entry.anxiousDogAdjustmentHe.length).toBeGreaterThan(40);
    expect(entry.anxiousDogAdjustmentHe).not.toMatch(/פרונג|קולר אלקטרוני|Slip Lead|תיקון|לחץ רצועה|אלפא|דומיננט/);
    const ids = TRAINING_COMMANDS.map((other) => other.id);
    expect(entry.prerequisites.every((id) => ids.includes(id) && id !== entry.id)).toBe(true);
  });

  it('teaches only with reward: no force, leash jerks or aversive tools in the R+ curriculum', () => {
    const text = TRAINING_COMMANDS.flatMap((entry) => [entry.targetGoal, ...entry.steps.map((step) => step.instructionHe), ...entry.gear.map((item) => item.nameHe)]).join(' ');
    expect(text).not.toMatch(/פרונג|קולר אלקטרוני|Slip Lead|תיקון|לחץ רצועה|אלפא|דומיננט/);
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
