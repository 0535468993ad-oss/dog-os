// The training curriculum reaches the AI advisor's knowledge pipeline: supabase/knowledge/
// training-commands.json must equal what the builder produces from commandsData, and pass the
// ingestion validator. Regenerate after editing the curriculum: UPDATE_KNOWLEDGE=1 npx jest knowledgeExport
import fs from 'node:fs';
import path from 'node:path';

import { parseKnowledgeFile } from '../../../../scripts/lib/knowledgeSource';
import { TRAINING_COMMANDS } from '../data/commandsData';
import { trainingKnowledgeChunks } from '../utils/knowledgeExport';

const FILE = path.join(__dirname, '../../../../supabase/knowledge/training-commands.json');

describe('training knowledge export', () => {
  const expected = `${JSON.stringify(trainingKnowledgeChunks(TRAINING_COMMANDS), null, 2)}\n`;

  if (process.env.UPDATE_KNOWLEDGE === '1') {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, expected);
  }

  it('is in sync with the curriculum', () => {
    expect(fs.readFileSync(FILE, 'utf8')).toBe(expected);
  });

  it('passes the ingestion validator, unverified until reviewed', () => {
    const { chunks, errors } = parseKnowledgeFile(JSON.parse(expected), 'training-commands.json');
    expect(errors).toEqual([]);
    expect(chunks).toHaveLength(9);
    expect(chunks.every((chunk) => chunk.category === 'TRAINING_DRIVE' && chunk.verified === false)).toBe(true);
    expect(chunks.every((chunk) => chunk.content_he.includes('לאחר שהכלב מתרגל את הפקודה בסביבה הביתית השקטה'))).toBe(true);
  });

  it('carries citable numbered steps, handler mechanics and the reward-based fixes', () => {
    for (const chunk of trainingKnowledgeChunks(TRAINING_COMMANDS)) {
      for (const marker of ['שלב 1 –', 'שלב 4 –', 'ידיים, רצועה וגוף:', 'מה עושים:', 'מרקר המשך: "טוב"', 'מילת שחרור: "חופשי"']) expect(chunk.content_he).toContain(marker);
    }
  });

  it('exports each step with its own marker word, so holds are cited with "טוב"', () => {
    const stay = trainingKnowledgeChunks(TRAINING_COMMANDS).find((chunk) => chunk.slug === 'training-command-stay');
    expect(stay?.content_he).toContain('מרקר "טוב": בסוף הזמן, כשהכלב עדיין בתנוחה');
    expect(stay?.content_he).not.toContain('מרקר "כן!"');
  });

  it('never exports a balanced escalation: chat retrieval has no track, age or temperament gate', () => {
    const corpus = JSON.stringify(trainingKnowledgeChunks(TRAINING_COMMANDS));
    const escalations = TRAINING_COMMANDS.flatMap((command) => command.balancedTroubleshooting.flatMap((tip) => (tip.balancedEscalation ? [tip.balancedEscalation] : [])));
    expect(escalations.length).toBeGreaterThan(0);
    for (const text of escalations) expect(corpus).not.toContain(text);
    expect(corpus).not.toMatch(/פרונג|קולר אלקטרוני|Slip Lead|תיקון|לחץ רצועה|לחץ־שחרור|אלפא|דומיננט/);
  });
});
