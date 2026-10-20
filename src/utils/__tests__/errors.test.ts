import { reportError, sanitizeError, setErrorSink, toUserMessage, NETWORK_ERROR } from '../errors';

describe('sanitizeError', () => {
  it('keeps only name, code and a redacted message', () => {
    const error = Object.assign(new Error('Insert failed for owner@example.com on dog 00000000-0000-4000-8000-000000000002'), {
      code: '23505',
      details: 'Key (note)=(private journal text) already exists',
    });
    expect(sanitizeError(error, 'journal:add')).toEqual({
      where: 'journal:add',
      name: 'Error',
      code: '23505',
      message: 'Insert failed for [email] on dog [id]',
    });
  });

  it('redacts tokens and keys', () => {
    expect(sanitizeError(new Error('bad eyJhbGc.eyJzdWI.c2ln and sb_secret_abcdefghijklmnop'), 'x').message).toBe('bad [token] and [secret]');
  });

  it('never includes arbitrary fields of non-Error values', () => {
    expect(sanitizeError({ password: 'hunter2', body: 'secret' }, 'x')).toEqual({ where: 'x', name: 'object' });
    expect(sanitizeError(null, 'x')).toEqual({ where: 'x', name: 'object' });
  });

  it('truncates long messages', () => {
    expect(sanitizeError(new Error('x'.repeat(1000)), 'x').message).toHaveLength(300);
  });
});

describe('reportError', () => {
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    consoleError.mockRestore();
    setErrorSink(null);
  });

  it('hands the sink only the sanitized summary', () => {
    const sink = jest.fn();
    setErrorSink(sink);
    reportError(new Error('failed for owner@example.com'), 'test');
    expect(sink).toHaveBeenCalledWith({ where: 'test', name: 'Error', message: 'failed for [email]' });
  });

  it('never throws, even if the sink does', () => {
    setErrorSink(() => {
      throw new Error('sink down');
    });
    expect(() => reportError(new Error('x'), 'test')).not.toThrow();
  });
});

describe('toUserMessage', () => {
  let consoleWarn: jest.SpyInstance;
  beforeEach(() => {
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => consoleWarn.mockRestore());

  it('never surfaces raw server messages', () => {
    expect(toUserMessage(new Error('duplicate key value violates unique constraint "dogs_pkey"'), 'נכשל')).toBe('נכשל');
  });

  it('explains network failures', () => {
    expect(toUserMessage(new TypeError('Network request failed'))).toBe(NETWORK_ERROR);
  });
});
