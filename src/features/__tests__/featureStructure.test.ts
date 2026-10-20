// Feature-sliced architecture guard. Every feature has the same layers, and each layer only imports the
// ones below it: components → hooks → api / utils → types. ESLint (eslint.config.js) separately keeps the
// Supabase client inside api/ and caps file sizes; this test checks folder shape and layer imports.
import fs from 'node:fs';
import path from 'node:path';

const FEATURES = path.join(__dirname, '..');

/**
 * Features that predate the layout (api.ts / hooks.ts / logic/). Each moves to the layout the next time it
 * is modified, and is then removed from this list – the last test fails until it is.
 */
const LEGACY_FEATURES = new Set(['auth', 'chat', 'dashboard', 'dogs', 'health', 'journal', 'report', 'training']);

const REQUIRED_DIRS = ['api', 'hooks', 'utils', 'components'] as const;

/** A feature's own layer, relative or via @/features/<name>/ – not shared code such as @/components/ui. */
const layer = (name: string) => new RegExp(`^(\\.{1,2}/(.*/)?|@/features/[^/]+/)${name}(/|$)`);

/** What a file in each layer must not import. */
const FORBIDDEN_IMPORTS: Record<string, RegExp[]> = {
  utils: [/^react(-native)?$/, /^@\/lib\/supabase$/, layer('api'), layer('hooks'), layer('components')],
  api: [/^react(-native)?$/, layer('hooks'), layer('components')],
  hooks: [/^@\/lib\/supabase$/, layer('components')],
  components: [/^@\/lib\/supabase$/, layer('api')],
};

const featureNames = fs
  .readdirSync(FEATURES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== '__tests__')
  .map((entry) => entry.name);

const layered = featureNames.filter((name) => !LEGACY_FEATURES.has(name));

/** Source files under a directory, recursively, skipping tests. */
function sourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** Module specifiers of every import / export-from in a file. */
function importsOf(file: string): string[] {
  const source = fs.readFileSync(file, 'utf8');
  return [...source.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/g)].map((match) => match[1] ?? '');
}

/** Whether a feature has every required layer. */
function conforms(feature: string): boolean {
  const root = path.join(FEATURES, feature);
  return fs.existsSync(path.join(root, 'types.ts')) && REQUIRED_DIRS.every((dir) => sourceFiles(path.join(root, dir)).length > 0);
}

describe('feature structure', () => {
  it('finds the features', () => {
    expect(featureNames.length).toBeGreaterThan(5);
    expect(layered).toEqual(expect.arrayContaining(['account', 'legal', 'support']));
  });

  it.each(layered)('%s has types.ts, api/, hooks/, utils/ and components/', (feature) => {
    const root = path.join(FEATURES, feature);
    const missing = [
      ...(fs.existsSync(path.join(root, 'types.ts')) ? [] : ['types.ts']),
      ...REQUIRED_DIRS.filter((dir) => sourceFiles(path.join(root, dir)).length === 0).map((dir) => `${dir}/`),
    ];
    expect(missing).toEqual([]);
  });

  it.each(layered)('%s layers only import downward', (feature) => {
    const violations = Object.entries(FORBIDDEN_IMPORTS).flatMap(([layer, patterns]) =>
      sourceFiles(path.join(FEATURES, feature, layer)).flatMap((file) =>
        importsOf(file)
          .filter((specifier) => patterns.some((pattern) => pattern.test(specifier)))
          .map((specifier) => `${path.relative(FEATURES, file)} imports ${specifier}`),
      ),
    );
    expect(violations).toEqual([]);
  });

  // The guard is only as good as its patterns: an import check that matches nothing passes vacuously.
  it('recognises a feature’s own layers but not shared code', () => {
    for (const own of ['../components/X', './components', '@/features/legal/components', '../../hooks/useX']) {
      expect([layer('components'), layer('hooks')].some((pattern) => pattern.test(own))).toBe(true);
    }
    for (const shared of ['@/components/ui', '@/components/motion', '@/utils/errors', '../utils/apiHelpers', './hooksHelper']) {
      expect([layer('components'), layer('hooks'), layer('api')].some((pattern) => pattern.test(shared))).toBe(false);
    }
  });

  it('keeps the legacy list honest', () => {
    const unknown = [...LEGACY_FEATURES].filter((name) => !featureNames.includes(name));
    const alreadyMigrated = [...LEGACY_FEATURES].filter((name) => featureNames.includes(name) && conforms(name));
    expect({ unknown, alreadyMigrated }).toEqual({ unknown: [], alreadyMigrated: [] });
  });
});
