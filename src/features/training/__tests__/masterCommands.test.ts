// The nine master commands: both tracks, the mandatory generalisation rule, and the tactical gear.
import { MASTER_COMMANDS } from '../data/masterCommands';
import { GENERALIZATION_RULE_HE } from '../data/methodology';
import type { MasterCommandId, TrainingTrack } from '../types';
import { protocolFor } from '../utils/protocol';

const TRACKS: TrainingTrack[] = ['FORCE_FREE', 'BALANCED'];
const EXACT_RULE =
  'לאחר שהכלב מתרגל את הפקודה בסביבה הביתית השקטה וזה מצליח, יוצאים איתו בהדרגה לבלות ולתרגל בסביבה עם גירויים כדי להטמיע את ההתנהגות בכל תנאי.';

/** All gear names for a command on a track, joined for matching. */
const gearText = (id: MasterCommandId, track: TrainingTrack = 'FORCE_FREE') => {
  const command = MASTER_COMMANDS.find((entry) => entry.id === id);
  if (!command) throw new Error(`missing ${id}`);
  return protocolFor(command, track).gear.map((item) => `${item.nameHe} ${item.noteHe ?? ''}`).join(' | ');
};

describe('master commands', () => {
  it('are the nine commands in teaching order', () => {
    expect(MASTER_COMMANDS.map((command) => command.id)).toEqual(['sit', 'down', 'stay', 'recall', 'place', 'leave-it', 'drop-it', 'heel', 'touch']);
    expect(MASTER_COMMANDS.map((command) => command.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it.each(MASTER_COMMANDS.flatMap((command) => TRACKS.map((track) => [command.id, track, command] as const)))(
    '%s (%s) ends with the exact generalisation rule',
    (_id, track, command) => {
      const steps = protocolFor(command, track).stepsHe;
      expect(GENERALIZATION_RULE_HE).toBe(EXACT_RULE);
      expect(steps[steps.length - 1]).toBe(EXACT_RULE);
      expect(steps.filter((step) => step === EXACT_RULE)).toHaveLength(1);
      expect(steps.length).toBeGreaterThanOrEqual(4);
    },
  );

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
    expect(gearText('heel', 'FORCE_FREE')).not.toMatch(/פרונג/);
    expect(gearText('heel', 'BALANCED')).toMatch(/פרונג/);
    expect(gearText('recall', 'BALANCED')).toMatch(/קולר אלקטרוני/);
    expect(gearText('touch', 'BALANCED')).not.toMatch(/Slip|פרונג|אלקטרוני/);
  });

  it('never frames training as dominance or alpha', () => {
    const copy = MASTER_COMMANDS.flatMap((command) => TRACKS.flatMap((track) => [command.goalHe, ...protocolFor(command, track).stepsHe]));
    expect(copy.filter((text) => /אלפא|דומיננט|alpha|dominan/i.test(text))).toEqual([]);
  });
});
