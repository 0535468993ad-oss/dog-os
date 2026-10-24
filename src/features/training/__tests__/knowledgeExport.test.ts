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
});
