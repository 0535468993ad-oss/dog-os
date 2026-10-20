import type { ChatHistoryRow } from '@/lib/database.types';

import { ChatError } from '../api';
import { chatErrorMessage, mergeSentMessages, optimisticUserMessage, withoutMessage } from '../logic/chatMessages';

const row = (id: string, role: ChatHistoryRow['role'] = 'user'): ChatHistoryRow => ({ id, user_id: 'u', dog_id: 'd', role, message: id, created_at: '2026-10-18T10:00:00Z' });

describe('chat messages', () => {
  it('builds a pending user message', () => {
    const now = new Date('2026-10-18T10:00:00Z');
    expect(optimisticUserMessage('d', 'שלום', now)).toEqual({
      id: `pending-${now.getTime()}`,
      user_id: '',
      dog_id: 'd',
      role: 'user',
      message: 'שלום',
      created_at: '2026-10-18T10:00:00.000Z',
    });
  });

  it('replaces the pending message with the stored pair', () => {
    const merged = mergeSentMessages([row('old'), row('pending-1')], 'pending-1', [row('u1'), row('a1', 'assistant')]);
    expect(merged.map((m) => m.id)).toEqual(['old', 'u1', 'a1']);
  });

  it('rolls back a pending message', () => {
    expect(withoutMessage([row('old'), row('pending-1')], 'pending-1').map((m) => m.id)).toEqual(['old']);
  });

  it('explains known Edge Function errors and hides unknown ones', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(chatErrorMessage(new ChatError('rate_limited'))).toMatch(/מגבלת ההודעות/);
    expect(chatErrorMessage(new ChatError('ai_opted_out'))).toMatch(/כבוי/);
    expect(chatErrorMessage(new ChatError('something_new'))).toBe('משהו השתבש. נסו שוב.');
    warn.mockRestore();
  });
});
