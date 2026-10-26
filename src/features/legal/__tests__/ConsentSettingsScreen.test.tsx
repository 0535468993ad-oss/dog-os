// Characterization of the consent settings screen: required rows with version and source, the two
// optional switches and what they record, a failed save, and the history list.
import { fireEvent, render, screen } from '@testing-library/react-native';

import { makeConsent } from '@/test/fixtures';
import type { UserConsentRow } from '@/lib/database.types';

import { ConsentSettingsScreen } from '../ConsentSettingsScreen';

const mockRows: { current: UserConsentRow[] } = { current: [] };
const mockMutate = jest.fn();

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { router: { push: jest.fn() }, Stack: { Screen: () => null }, Link: Text };
});
jest.mock('@/features/auth/AuthProvider', () => ({ useUser: () => ({ id: 'u1' }) }));
jest.mock('../hooks/consents', () => ({
  useConsents: () => ({ isLoading: false, error: null, data: mockRows.current, refetch: jest.fn() }),
  useRecordConsents: () => ({ mutate: mockMutate, isPending: false }),
}));
jest.mock('../hooks/cookieConsent', () => ({ setCookieConsent: jest.fn() }));

const ROWS = [
  makeConsent({ id: 'c3', consent_type: 'ai_data_sharing', granted: true, source: 'signup', created_at: '2026-10-19T08:00:00.000Z' }),
  makeConsent({ id: 'c2', consent_type: 'privacy_policy', source: 'signup' }),
  makeConsent({ id: 'c1', consent_type: 'terms_of_service', source: 'reconsent' }),
];

describe('ConsentSettingsScreen', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockRows.current = ROWS;
  });

  it('shows each required consent with its status, and the history', async () => {
    await render(<ConsentSettingsScreen />);
    // The terms title appears twice: the row heading and its legal link.
    expect(screen.getAllByText('תקנון ותנאי שימוש')).toHaveLength(2);
    expect(screen.getByText('הצהרת בינה מלאכותית')).toBeOnTheScreen();
    expect(screen.getAllByText('אושר').length).toBe(2);
    expect(screen.getByText('לא אושר')).toBeOnTheScreen();
    expect(screen.getByText(/· אישור מחדש ·/)).toBeOnTheScreen();
    expect(screen.getByText(/– שיתוף מידע עם ספק הבינה המלאכותית: אושר \(בהרשמה\)$/)).toBeOnTheScreen();
  });

  it('records a switch change from settings', async () => {
    await render(<ConsentSettingsScreen />);
    expect(screen.getByRole('switch', { name: 'שיתוף מידע עם ספק הבינה המלאכותית' })).toBeChecked();
    await fireEvent(screen.getByRole('switch', { name: 'שיתוף מידע עם ספק הבינה המלאכותית' }), 'valueChange', false);
    expect(mockMutate).toHaveBeenCalledWith({ types: ['ai_data_sharing'], granted: false, source: 'settings' }, expect.any(Object));
    await fireEvent(screen.getByRole('switch', { name: 'הסכמה לאנליטיקה' }), 'valueChange', true);
    expect(mockMutate).toHaveBeenLastCalledWith({ types: ['analytics'], granted: true, source: 'settings' }, expect.any(Object));
  });

  it('announces a failed save', async () => {
    mockMutate.mockImplementation((_vars: unknown, handlers: { onError: (error: Error) => void }) => handlers.onError(new Error('boom')));
    await render(<ConsentSettingsScreen />);
    await fireEvent(screen.getByRole('switch', { name: 'הסכמה לאנליטיקה' }), 'valueChange', true);
    expect(screen.getByRole('alert')).toBeOnTheScreen();
  });

  it('says so when there is no history', async () => {
    mockRows.current = [];
    await render(<ConsentSettingsScreen />);
    expect(screen.getByText('אין רישומים.')).toBeOnTheScreen();
    expect(screen.getAllByText('לא אושר').length).toBe(3);
  });
});
