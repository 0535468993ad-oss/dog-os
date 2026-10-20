import { isSupportRequestType, REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS } from '../api';

describe('isSupportRequestType', () => {
  it.each(Object.keys(REQUEST_TYPE_LABELS))('accepts %s', (type) => {
    expect(isSupportRequestType(type)).toBe(true);
  });

  it.each([['constructor'], ['toString'], ['__proto__'], [''], ['privacy'], [undefined], [42]])('rejects %s', (value) => {
    expect(isSupportRequestType(value)).toBe(false);
  });
});

describe('labels', () => {
  it('has a Hebrew label for every request status', () => {
    expect(Object.keys(REQUEST_STATUS_LABELS).sort()).toEqual(['closed', 'in_progress', 'open']);
  });
});
