// The dog_training_game schema and the app must agree: every column the app upserts exists in a
// migration (otherwise PostgREST answers PGRST204), and the latest check constraints allow exactly the
// badge and reward ids the app writes (otherwise the upload fails with 23514).
import fs from 'node:fs';
import path from 'node:path';

import { BADGES } from '../data/badgesData';
import { LEVEL_REWARDS } from '../data/rewardsData';

const MIGRATIONS = path.resolve(__dirname, '../../../../supabase/migrations');
const sql = fs
  .readdirSync(MIGRATIONS)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'))
  .join('\n');

/** The ids in the last `<column> <@ array[...]` check, in migration order. */
function latestAllowed(column: string): string[] {
  const checks = [...sql.matchAll(new RegExp(`${column}\\s*<@\\s*array\\[([^\\]]*)\\]`, 'g'))];
  const body = checks[checks.length - 1]?.[1] ?? '';
  return [...body.matchAll(/'([a-z0-9_-]+)'/g)].flatMap((match) => (match[1] ? [match[1]] : []));
}

describe('dog_training_game schema', () => {
  it('has every column the app upserts', () => {
    const remote = fs.readFileSync(path.join(__dirname, '../api/gameRemote.ts'), 'utf8');
    const upsert = remote.slice(remote.indexOf('.upsert('), remote.indexOf('onConflict'));
    const columns = [...upsert.matchAll(/^\s+([a-z_]+):/gm)].flatMap((match) => (match[1] ? [match[1]] : []));
    expect(columns).toEqual(expect.arrayContaining(['claimed_rewards', 'unlocked_trophies', 'state']));
    const defined = (column: string) =>
      new RegExp(`(^\\s*${column}\\s+(uuid|integer|smallint|date|text\\[\\]|timestamptz|jsonb)(?![\\w]))|add column ${column}\\b`, 'm').test(sql);
    expect(columns.filter((column) => !defined(column))).toEqual([]);
  });

  it('allows exactly the badge ids the app writes', () => {
    expect(latestAllowed('unlocked_trophies').sort()).toEqual(BADGES.map((badge) => badge.id).sort());
  });

  it('allows exactly the rewards the app can claim', () => {
    const claimable = LEVEL_REWARDS.filter((reward) => reward.availability === 'AVAILABLE').map((reward) => reward.id);
    expect(latestAllowed('claimed_rewards').sort()).toEqual(claimable.sort());
  });
});
