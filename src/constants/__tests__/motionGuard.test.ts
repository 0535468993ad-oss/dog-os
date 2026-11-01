// Static motion guard: springs come from SPRINGS in src/constants/motion.ts, never tuned by hand at the call
// site and never Reanimated's default, so every surface moves with the same physics.
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(__dirname, '..', '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

const files = sourceFiles(SRC).map((file) => ({ file: path.relative(SRC, file), source: fs.readFileSync(file, 'utf8') }));

function violations(pattern: RegExp) {
  return files.flatMap(({ file, source }) => (source.match(pattern) ?? []).map((hit) => `${file}: ${hit}`));
}

describe('motion guard', () => {
  it('scans the app', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('never uses a spring without a SPRINGS preset', () => {
    expect(violations(/withSpring\(\s*[^,()]+\)/g)).toEqual([]);
  });

  it('never hand-tunes spring physics at the call site', () => {
    expect(violations(/withSpring\([^;]*?\{\s*(?:mass|stiffness|damping|dampingRatio|duration)\s*:/g)).toEqual([]);
  });

  it('enters with springs (enterAt), not fixed-duration fades', () => {
    expect(violations(/\b(?:FadeIn|SlideIn|ZoomIn)\w*\.duration\(/g)).toEqual([]);
  });
});
