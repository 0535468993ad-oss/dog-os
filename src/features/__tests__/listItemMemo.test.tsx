// List items whose parents re-render often are memoized: a parent re-render with equal props must not
// re-render the item. The probe counts calls to a function each item runs while rendering.
import { render, screen, userEvent } from '@testing-library/react-native';
import { useState, type ReactElement } from 'react';
import { Pressable, Text } from 'react-native';

import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { VetArticleCard } from '@/features/health/encyclopedia/VetArticleCard';
import { JournalEntryCard } from '@/features/journal/components/JournalEntryCard';
import { makeJournal } from '@/test/fixtures';

const mockFormatDate = jest.fn((iso: string) => iso);
const mockFormatTime = jest.fn((iso: string) => iso);

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/utils/date', () => ({
  ...jest.requireActual<typeof import('@/utils/date')>('@/utils/date'),
  formatDate: (iso: string) => mockFormatDate(iso),
  formatTime: (iso: string) => mockFormatTime(iso),
}));

/** Renders `child` under a parent whose own state change re-renders it with the same props. */
async function renderUnderBusyParent(child: ReactElement) {
  function Parent() {
    const [ticks, setTicks] = useState(0);
    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => setTicks(ticks + 1)}>
          <Text>{`tick ${ticks}`}</Text>
        </Pressable>
        {child}
      </>
    );
  }
  const user = userEvent.setup();
  await render(<Parent />);
  return () => user.press(screen.getByRole('button', { name: /^tick/ }));
}

const MEMO = Symbol.for('react.memo');
const isMemo = (component: unknown) => typeof component === 'object' && component !== null && (component as { $$typeof?: symbol }).$$typeof === MEMO;

describe('memoized list items', () => {
  beforeEach(() => {
    mockFormatDate.mockClear();
    mockFormatTime.mockClear();
  });

  it('a journal entry card skips a parent re-render with the same entry and handler', async () => {
    const entry = makeJournal();
    const onDelete = jest.fn();
    const rerenderParent = await renderUnderBusyParent(<JournalEntryCard entry={entry} onDelete={onDelete} />);
    const afterMount = mockFormatDate.mock.calls.length;
    expect(afterMount).toBeGreaterThan(0);
    await rerenderParent();
    expect(screen.getByText('tick 1')).toBeOnTheScreen();
    expect(mockFormatDate.mock.calls.length).toBe(afterMount);
  });

  it('a chat bubble skips a parent re-render with the same message', async () => {
    const message = { id: 'm1', user_id: 'u1', dog_id: null, role: 'assistant' as const, message: 'שלום', created_at: '2026-10-01T10:00:00.000Z' };
    const rerenderParent = await renderUnderBusyParent(<MessageBubble message={message} />);
    const afterMount = mockFormatTime.mock.calls.length;
    expect(afterMount).toBeGreaterThan(0);
    await rerenderParent();
    expect(screen.getByText('tick 1')).toBeOnTheScreen();
    expect(mockFormatTime.mock.calls.length).toBe(afterMount);
  });

  // The article card calls nothing a probe can count while rendering, so this asserts the memo wrapper itself.
  it('the encyclopedia article card is a memo component', () => {
    expect(isMemo(VetArticleCard)).toBe(true);
  });
});
