// Characterization of the journal: an empty note is refused, an added entry clears the form, a failed
// delete is announced, and the empty / failed list states.
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { makeDog, makeJournal } from '@/test/fixtures';
import type { JournalEntryRow } from '@/lib/database.types';
import { todayIso } from '@/utils/date';

import { JournalScreen } from '../JournalScreen';

const mockAdd = jest.fn(async () => undefined);
const mockRemove = jest.fn();
const mockJournal: { data: JournalEntryRow[] | undefined; error: Error | null } = { data: [], error: null };
const mockDog = makeDog();

jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));
jest.mock('@react-native-community/datetimepicker', () => ({ __esModule: true, default: () => null, DateTimePickerAndroid: { open: jest.fn() } }));
jest.mock('@/features/dogs/hooks', () => ({ useActiveDog: () => ({ activeDog: mockDog, isLoading: false }) }));
jest.mock('../hooks', () => ({
  useJournal: () => ({ isLoading: false, data: mockJournal.data, error: mockJournal.error, refetch: jest.fn() }),
  useJournalMutations: () => ({ add: { mutateAsync: mockAdd, isPending: false }, remove: { mutate: mockRemove } }),
}));

describe('JournalScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJournal.data = [makeJournal({ mood: 'good' })];
    mockJournal.error = null;
  });

  it('refuses an empty note', async () => {
    const user = userEvent.setup();
    await render(<JournalScreen />);
    await user.press(screen.getByRole('button', { name: 'הוספה ליומן' }));
    expect(screen.getByText('כתבו מה קרה היום.')).toBeOnTheScreen();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('adds an entry with category, mood and date, then clears the note and mood', async () => {
    const user = userEvent.setup();
    await render(<JournalScreen />);
    await user.press(screen.getByRole('radio', { name: 'אימון' }));
    await user.press(screen.getByRole('radio', { name: 'מצוין' }));
    await user.type(screen.getByLabelText('מה קרה?'), '  ישב יפה  ');
    await user.press(screen.getByRole('button', { name: 'הוספה ליומן' }));
    await waitFor(() => expect(mockAdd).toHaveBeenCalledWith({ dogId: mockDog.id, note: 'ישב יפה', category: 'training', mood: 'great', entryDate: todayIso() }));
    expect(screen.getByLabelText('מה קרה?')).toHaveDisplayValue('');
    expect(screen.getByRole('radio', { name: 'מצוין' })).not.toBeChecked();
  });

  it('lists entries and announces a failed delete', async () => {
    mockRemove.mockImplementation((_id: string, handlers: { onError: (error: Error) => void }) => handlers.onError(new Error('boom')));
    const user = userEvent.setup();
    await render(<JournalScreen />);
    expect(screen.getByText('טיול רגוע')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: /^מחיקת הרשומה מ/ }));
    expect(mockRemove).toHaveBeenCalledWith('j-1', expect.any(Object));
    expect(screen.getByText('מחיקת הרשומה נכשלה. נסו שוב.')).toBeOnTheScreen();
  });

  it('shows the empty state and a failed list', async () => {
    mockJournal.data = [];
    const view = await render(<JournalScreen />);
    expect(screen.getByText('היומן ריק')).toBeOnTheScreen();
    mockJournal.data = undefined;
    mockJournal.error = new Error('offline');
    await view.rerender(<JournalScreen />);
    expect(screen.queryByText('היומן ריק')).toBeNull();
    expect(screen.getByRole('button', { name: /נסו שוב|ניסיון חוזר/ })).toBeOnTheScreen();
  });
});
