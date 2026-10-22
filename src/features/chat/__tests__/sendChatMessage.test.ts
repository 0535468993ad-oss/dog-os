// Chat failures map to a specific Hebrew message: our function's `{ error: { code } }` body, and the
// Supabase gateway's own responses (function not deployed, boot failure) that used to read as
// "משהו השתבש".
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { readFunctionError, reportError } from '@/utils/errors';

import { sendChatMessage } from '../api/chat';
import { CHAT_ERROR_MESSAGES, ChatError } from '../utils/chatErrors';

jest.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke: jest.fn() } } }));
jest.mock('@/utils/errors', () => ({ ...jest.requireActual('@/utils/errors'), reportError: jest.fn() }));

const invoke = supabase.functions.invoke as jest.Mock;

/** A FunctionsHttpError as supabase-js builds it: the raw response is the error's context. */
function httpError(status: number, body: unknown): FunctionsHttpError {
  return new FunctionsHttpError({ status, json: async () => body });
}

beforeEach(() => {
  invoke.mockReset();
  (reportError as jest.Mock).mockReset();
});

describe('readFunctionError', () => {
  it('reads our function’s error code', async () => {
    expect(await readFunctionError(httpError(429, { error: { code: 'rate_limited' } }))).toEqual({ code: 'rate_limited', status: 429 });
  });

  it('recognises the gateway’s responses', async () => {
    expect(await readFunctionError(httpError(404, { code: 'NOT_FOUND', message: 'Requested function was not found' }))).toEqual({ code: 'not_deployed', status: 404 });
    expect(await readFunctionError(httpError(503, { code: 'BOOT_ERROR' }))).toEqual({ code: 'unavailable', status: 503 });
    expect(await readFunctionError(httpError(401, { msg: 'Invalid JWT' }))).toEqual({ code: 'unauthorized', status: 401 });
    expect((await readFunctionError(new FunctionsFetchError('offline'))).code).toBe('network');
  });
});

describe('sendChatMessage', () => {
  it('sends { dogId, message } – the shape the chat function validates', async () => {
    const rows = [
      { id: 'u', role: 'user', message: 'שלום', created_at: '2026-10-22T10:00:00Z' },
      { id: 'a', role: 'assistant', message: 'היי', created_at: '2026-10-22T10:00:01Z' },
    ];
    invoke.mockResolvedValue({ data: { messages: rows }, error: null });
    await expect(sendChatMessage('dog-1', 'שלום')).resolves.toEqual(rows);
    expect(invoke).toHaveBeenCalledWith('chat', { body: { dogId: 'dog-1', message: 'שלום' } });
  });

  it('turns a missing deployment into a clear message and reports it', async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(404, { code: 'NOT_FOUND', message: 'Requested function was not found' }) });
    const failure = await sendChatMessage(null, 'שלום').catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ChatError);
    expect((failure as ChatError).code).toBe('not_deployed');
    expect(CHAT_ERROR_MESSAGES.not_deployed).toMatch(/לא הופעל בשרת/);
    expect(reportError).toHaveBeenCalledWith(expect.any(FunctionsHttpError), 'chat:invoke:404');
  });

  it('does not report expected, user-facing failures', async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(429, { error: { code: 'rate_limited' } }) });
    await expect(sendChatMessage(null, 'שלום')).rejects.toMatchObject({ code: 'rate_limited' });
    expect(reportError).not.toHaveBeenCalled();
  });
});
