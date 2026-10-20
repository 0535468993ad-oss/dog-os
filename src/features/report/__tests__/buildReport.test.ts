import { makeDog, makeHealth, makeJournal, makeVaccination } from '@/test/fixtures';

import { buildReportHtml, REPORT_CSP } from '../buildReport';

const PAYLOAD = '<img src=x onerror="alert(1)">';

function build(overrides: Partial<Parameters<typeof buildReportHtml>[0]> = {}) {
  return buildReportHtml({
    dog: makeDog(),
    health: makeHealth(),
    modules: [],
    perModule: new Map(),
    streak: 0,
    journal: [],
    ...overrides,
  });
}

describe('buildReportHtml', () => {
  it('is a Hebrew right-to-left document', () => {
    const html = build();
    expect(html).toContain('<html lang="he" dir="rtl">');
    expect(html).toContain('רקסי');
  });

  // The report is printed in a browser window: owner-written text must never become markup (XSS).
  it('escapes every owner-written field', () => {
    const html = build({
      dog: makeDog({ name: PAYLOAD, breed: PAYLOAD }),
      health: makeHealth({ vaccinations: [makeVaccination({ name: PAYLOAD, notes: PAYLOAD })] }),
      journal: [makeJournal({ note: `${PAYLOAD}</td><script>alert(2)</script>` })],
    });
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('shows an explicit empty state for sections without records', () => {
    expect(build()).toContain('אין רשומות.');
  });

  it('includes at most the 30 most recent journal entries', () => {
    const journal = Array.from({ length: 35 }, (_, i) => makeJournal({ id: `j${i}`, note: `entry-${i}` }));
    const html = build({ journal });
    expect(html).toContain('entry-29');
    expect(html).not.toContain('entry-30');
  });
});

describe('report Content-Security-Policy', () => {
  it('ships a CSP that forbids scripts, network requests and forms', () => {
    const html = build();
    expect(html).toContain(`<meta http-equiv="Content-Security-Policy" content="${REPORT_CSP}">`);
    expect(REPORT_CSP).toMatch(/default-src 'none'/);
    expect(REPORT_CSP).not.toMatch(/script-src|unsafe-eval/);
    expect(REPORT_CSP).toMatch(/form-action 'none'/);
  });

  it('places the CSP before any user-controlled content', () => {
    const html = build({ dog: makeDog({ name: '<script>alert(1)</script>' }) });
    expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('&lt;script&gt;'));
    expect(html).not.toContain('<script>');
  });
});
