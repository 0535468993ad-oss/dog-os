import { isDeleteConfirmed, DELETE_PHRASE } from '../utils/deleteConfirmation';
import { buildExportPayload, exportFileName } from '../utils/exportPayload';

describe('buildExportPayload', () => {
  it('stamps the export time and keeps the account email and all table data', () => {
    const data = { dogs: [{ id: 'd1' }], journal_entries: [] };
    const payload = buildExportPayload(data, 'owner@example.com', new Date('2026-10-20T08:30:00.000Z'));

    expect(payload).toEqual({
      exported_at: '2026-10-20T08:30:00.000Z',
      account: { email: 'owner@example.com' },
      note: expect.stringContaining('תמונות'),
      data,
    });
  });

  it('allows an account without an email', () => {
    expect(buildExportPayload({}, undefined, new Date(0)).account).toEqual({ email: undefined });
  });
});

describe('exportFileName', () => {
  it('names the file by date', () => {
    expect(exportFileName('2026-10-20')).toBe('dog-os-data-2026-10-20.json');
  });
});

describe('isDeleteConfirmed', () => {
  it.each([
    [DELETE_PHRASE, true],
    [`  ${DELETE_PHRASE} `, true],
    ['', false],
    ['מחק', false],
    ['delete', false],
  ])('%j → %s', (typed, expected) => {
    expect(isDeleteConfirmed(typed)).toBe(expected);
  });
});
