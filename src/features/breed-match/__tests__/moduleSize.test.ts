// breed-match carries large datasets, so its size limits are checked on raw lines (comments and blank
// lines included), stricter than ESLint's max-lines: under 200 per file, under 180 per data file.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(__dirname, '..');

/** Source files under a directory, recursively, skipping tests. */
function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

const lineCount = (file: string) => fs.readFileSync(file, 'utf8').split('\n').length;

describe('breed-match module size', () => {
  const files = sourceFiles(ROOT);

  it('finds the module files', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it('keeps every file under 200 lines and every data file under 180', () => {
    const oversized = files
      .filter((file) => lineCount(file) >= (file.includes(`${path.sep}data${path.sep}`) ? 180 : 200))
      .map((file) => `${path.relative(ROOT, file)}: ${lineCount(file)}`);
    expect(oversized).toEqual([]);
  });

  it('uses no explicit any', () => {
    const offenders = files.filter((file) => /(:\s*any\b|as any\b|<any>)/.test(fs.readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
