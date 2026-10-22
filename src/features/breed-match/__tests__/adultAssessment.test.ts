// The adult-dog protocol: 3-3-3 stages and a checklist that blocks a decision until the safety steps are done.
import { ADULT_ASSESSMENT_CHECKLIST, DECOMPRESSION_STAGES } from '../data/adultProtocol';
import { checklistProgress, toggleId } from '../utils/adultAssessment';

const CRITICAL = ['out-of-kennel', 'no-hand-in-bowl', 'parallel-walk'];

describe('adult assessment', () => {
  it('teaches the 3-3-3 decompression stages in order', () => {
    expect(DECOMPRESSION_STAGES.map((stage) => stage.titleHe.slice(0, 1))).toEqual(['3', '3', '3']);
    expect(DECOMPRESSION_STAGES.map((stage) => stage.id)).toEqual(['days', 'weeks', 'months']);
  });

  it('marks the three safety steps as critical, with the concrete rules', () => {
    expect(ADULT_ASSESSMENT_CHECKLIST.filter((item) => item.critical).map((item) => item.id)).toEqual(CRITICAL);
    const byId = (id: string) => ADULT_ASSESSMENT_CHECKLIST.find((item) => item.id === id)?.detailHe ?? '';
    expect(byId('out-of-kennel')).toMatch(/25 דקות/);
    expect(byId('no-hand-in-bowl')).toMatch(/אסור להכניס יד/);
    expect(byId('parallel-walk')).toMatch(/10 מ׳/);
  });

  it('is not ready to decide until every critical step is done', () => {
    expect(checklistProgress([]).readyToDecide).toBe(false);
    expect(checklistProgress(['foster-report', 'medical']).missingCritical).toHaveLength(3);
    const ready = checklistProgress(CRITICAL);
    expect(ready).toMatchObject({ done: 3, total: ADULT_ASSESSMENT_CHECKLIST.length, readyToDecide: true, missingCritical: [] });
  });

  it('toggles ids without mutating', () => {
    const start = ['a'];
    expect(toggleId(start, 'b')).toEqual(['a', 'b']);
    expect(toggleId(start, 'a')).toEqual([]);
    expect(start).toEqual(['a']);
  });
});
