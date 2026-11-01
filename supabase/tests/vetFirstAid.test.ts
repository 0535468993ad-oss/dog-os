// Migrations applied by hand in the SQL Editor, checked here so a mistake fails in CI instead of there:
// the first-aid content update (every action array parses, the safety points are present) and the
// unverified-by-default knowledge flag.
import fs from 'node:fs';
import path from 'node:path';

const MIGRATION = path.join(__dirname, '..', 'migrations', '20261029120000_vet_first_aid_refinements.sql');
const sql = fs.readFileSync(MIGRATION, 'utf8');

/** Each `set actions = $json$…$json$::jsonb where id = '…'` in the file, parsed. */
function updates(): { id: string; actions: unknown }[] {
  const pattern = /set actions = \$json\$([\s\S]*?)\$json\$::jsonb\s+where id = '([a-z0-9-]+)'/g;
  return [...sql.matchAll(pattern)].map((match) => ({ id: match[2] ?? '', actions: JSON.parse(match[1] ?? '') as unknown }));
}

/** True for a non-empty array of { title, body } strings – the shape the app's VetAction expects. */
function isActionList(value: unknown): value is { title: string; body: string }[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item: unknown) => typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).title === 'string' && typeof (item as Record<string, unknown>).body === 'string')
  );
}

const text = (id: string) => JSON.stringify(updates().find((update) => update.id === id)?.actions ?? []);

describe('vet first-aid refinements migration', () => {
  it('updates exactly the three emergency articles, each with a valid action list', () => {
    const all = updates();
    expect(all.map((update) => update.id)).toEqual(['heatstroke', 'snake-bite', 'seizures']);
    for (const update of all) expect([update.id, isActionList(update.actions)]).toEqual([update.id, true]);
  });

  it('only updates content: no schema change, no inserts or deletes', () => {
    const statements = sql.replace(/--.*$/gm, '');
    expect(statements).not.toMatch(/\b(alter|create|drop|insert|delete|truncate)\b/i);
  });

  it('keeps the heatstroke rules: cool first, stop at 39.5 °C, no towel left on', () => {
    expect(text('heatstroke')).toMatch(/קודם לקרר/);
    expect(text('heatstroke')).toMatch(/39\.5°C/);
    expect(text('heatstroke')).toMatch(/מגבת רטובה שנשארת/);
  });

  it('adds the collar and human-painkiller warnings to snake bites', () => {
    expect(text('snake-bite')).toMatch(/הסירו קולר/);
    expect(text('snake-bite')).toMatch(/משככי כאבים של בני אדם/);
    expect(text('snake-bite')).toMatch(/חוסם עורקים/);
  });

  it('keeps nothing by mouth after a seizure and the 5-minute rule', () => {
    expect(text('seizures')).toMatch(/שום דבר דרך הפה/);
    expect(text('seizures')).toMatch(/מעל 5 דקות/);
  });
});

describe('knowledge unverified-by-default migration', () => {
  const knowledgeSql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '20261029130000_knowledge_unverified_default.sql'), 'utf8');
  const statements = knowledgeSql.replace(/--.*$/gm, '').trim();

  it('only flips the column default to false, touching no rows', () => {
    expect(statements).toBe('alter table public.knowledge_chunks alter column is_verified set default false;');
  });
});

