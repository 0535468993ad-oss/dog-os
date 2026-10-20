// Static accessibility guards (WCAG 2.1 AA) over every component in src/. They fail the build when a
// new interactive element, image or icon ships without what assistive technology needs.
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(__dirname, '..', '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return entry.name.endsWith('.tsx') ? [full] : [];
  });
}

/** Opening tags `<Name ...>` with their attributes, respecting `{...}` expressions that contain `>`. */
function openingTags(source: string, name: string): string[] {
  const tags: string[] = [];
  const pattern = new RegExp(`<${name}(?=[\\s>/])`, 'g');
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    let depth = 0;
    let end = match.index;
    for (let i = match.index; i < source.length; i += 1) {
      const ch = source[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      else if (ch === '>' && depth === 0) {
        end = i;
        break;
      }
    }
    tags.push(source.slice(match.index, end + 1));
  }
  return tags;
}

const files = sourceFiles(SRC).map((file) => ({ file: path.relative(SRC, file), source: fs.readFileSync(file, 'utf8') }));

function violations(name: string, isValid: (tag: string) => boolean) {
  return files.flatMap(({ file, source }) => openingTags(source, name).filter((tag) => !isValid(tag)).map((tag) => `${file}: ${tag.slice(0, 120)}`));
}

describe('accessibility guards', () => {
  it('scans the app', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('every Pressable and PressableScale declares a role', () => {
    const hasRole = (tag: string) => /accessibilityRole=|\brole=/.test(tag);
    expect([...violations('Pressable', hasRole), ...violations('PressableScale', hasRole), ...violations('AnimatedPressableBase', () => true)]).toEqual([]);
  });

  it('every image has a text alternative', () => {
    const hasAlt = (tag: string) => /accessibilityLabel=/.test(tag) && /\balt=/.test(tag);
    expect(violations('Image', hasAlt)).toEqual([]);
  });

  it('every icon is either labelled or marked decorative', () => {
    const ok = (tag: string) => /accessible=\{false\}/.test(tag) || /accessibilityLabel=/.test(tag);
    expect(violations('Ionicons', ok)).toEqual([]);
  });

  it('every IconButton has a label', () => {
    expect(violations('IconButton', (tag) => /accessibilityLabel=/.test(tag))).toEqual([]);
  });

  it('every TextInput has a label', () => {
    expect(violations('TextInput', (tag) => /accessibilityLabel=/.test(tag))).toEqual([]);
  });

  // Users who enlarge system text must get larger text (WCAG 1.4.4).
  it('never disables or caps dynamic type', () => {
    const offenders = files.filter(({ source }) => /allowFontScaling=\{false\}|maxFontSizeMultiplier/.test(source)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});
