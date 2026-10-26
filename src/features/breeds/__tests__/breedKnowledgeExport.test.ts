// The breed profiles reach the AI advisor's knowledge pipeline: supabase/knowledge/breeds.json must equal
// what the exporter produces, and pass the ingestion validator. Regenerate after editing the profiles:
// UPDATE_KNOWLEDGE=1 npx jest breedKnowledgeExport
import fs from 'node:fs';
import path from 'node:path';

import { parseKnowledgeFile } from '../../../../scripts/lib/knowledgeSource';
import { BREED_PROFILES } from '../data/breedsSeedData';
import { breedKnowledgeChunks, breedToMarkdown } from '../services/breedKnowledgeExporter';

const FILE = path.join(__dirname, '../../../../supabase/knowledge/breeds.json');

describe('breed knowledge export', () => {
  const expected = `${JSON.stringify(breedKnowledgeChunks(BREED_PROFILES), null, 2)}\n`;

  if (process.env.UPDATE_KNOWLEDGE === '1') {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, expected);
  }

  it('is in sync with the breed profiles', () => {
    expect(fs.readFileSync(FILE, 'utf8')).toBe(expected);
  });

  it('passes the ingestion validator: four unverified chunks per breed', () => {
    const { chunks, errors } = parseKnowledgeFile(JSON.parse(expected), 'breeds.json');
    expect(errors).toEqual([]);
    expect(chunks).toHaveLength(BREED_PROFILES.length * 4);
    expect(chunks.every((chunk) => chunk.verified === false)).toBe(true);
    expect(new Set(chunks.map((chunk) => chunk.slug)).size).toBe(chunks.length);
  });

  it('keeps the medical chunk non-diagnostic and the bloat warning in it', () => {
    const medical = breedKnowledgeChunks(BREED_PROFILES).find((chunk) => chunk.slug === 'breed-german-shepherd-medical');
    expect(medical?.content_he).toMatch(/לא אבחנה/);
    expect(medical?.content_he).toMatch(/תסובב קיבה: נטייה גבוהה/);
  });

  it('renders a whole profile as Markdown with all four sections', () => {
    const profile = BREED_PROFILES[0];
    if (!profile) throw new Error('empty catalog');
    expect(breedToMarkdown(profile).match(/^## /gm)).toHaveLength(4);
  });
});
