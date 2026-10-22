// The commands tab end to end: temperament recommendation, the track switch with its safety gate,
// the locked confirm button, and the step-mark haptic.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { CommandsTab } from '../components/CommandsTab';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));
jest.mock('../api/gameRemote', () => ({ fetchRemoteGame: jest.fn(async () => null), upsertRemoteGame: jest.fn(async () => undefined) }));
jest.mock('@/features/dogs/hooks', () => ({
  useActiveDog: () => ({ isLoading: false, activeDog: { id: 'd1', name: 'ג׳קסון', breed_id: 'german-shepherd', birth_date: '2023-09-01' } }),
}));

describe('CommandsTab', () => {
  // The storage mock persists across tests in a file; each test starts from a fresh dog.
  beforeEach(() => AsyncStorage.clear());

  it('shows level 1, the nine commands and the trophy vault', async () => {
    await renderTab();
    expect(screen.getByText('ג׳קסון · גור סקרן')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^9\. גע \/ טאץ׳/ })).toBeOnTheScreen();
    expect(screen.getByLabelText(/מגנט החזרה: נעול/)).toBeOnTheScreen();
  });

  it('recommends the balanced track for a high-arousal adult shepherd', async () => {
    const user = await renderTab();
    await user.press(screen.getByRole('radio', { name: 'עוררות גבוהה / דחף ציד קיצוני' }));
    expect(screen.getByText('מומלץ: אילוף מאוזן')).toBeOnTheScreen();
    expect(screen.getByText('מסלול מאוזן, בליווי מאלף מקצועי')).toBeOnTheScreen();
  });

  it('opens the balanced protocol only after the safety notice is confirmed', async () => {
    const user = await renderTab();
    await user.press(screen.getByRole('button', { name: /^1\. שב/ }));
    expect(screen.getByText(/פיתוי, מרקר ותגמול/)).toBeOnTheScreen();

    await user.press(screen.getByRole('tab', { name: 'אילוף מאוזן' }));
    expect(screen.getByRole('button', { name: 'פתיחת המסלול המאוזן' })).toBeDisabled();
    await user.press(screen.getByRole('checkbox', { name: 'קראתי, ואשתמש בציוד רק לפי הכללים האלה' }));
    await user.press(screen.getByRole('button', { name: 'פתיחת המסלול המאוזן' }));
    expect(screen.getByText(/לחץ רצועה עדין שמשתחרר ברגע הביצוע/)).toBeOnTheScreen();
  });

  it('locks the balanced track for an anxious dog', async () => {
    const user = await renderTab();
    await user.press(screen.getByRole('radio', { name: 'חרדתי / רגיש' }));
    await user.press(screen.getByRole('button', { name: /^4\. אליי/ }));
    await user.press(screen.getByRole('tab', { name: 'אילוף מאוזן' }));
    expect(screen.getByText(/המסלול המאוזן לא מתאים לכלב הזה/)).toBeOnTheScreen();
  });

  it('keeps the confirm button locked at the start of a live session, and buzzes on a step mark', async () => {
    const user = await renderTab();
    await user.press(screen.getByRole('button', { name: /^1\. שב/ }));
    await user.press(screen.getByRole('button', { name: 'התחלת אימון חי' }));

    expect(screen.getByRole('button', { name: /אישור ייפתח בעוד 3:00/ })).toBeDisabled();
    await user.press(screen.getByRole('button', { name: 'סימון שלב (0)' }));
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(screen.getByRole('button', { name: 'סימון שלב (1)' })).toBeOnTheScreen();
  });
});

/** Renders the tab once the stored state has loaded. */
async function renderTab() {
  const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const user = userEvent.setup();
  await render(
    <QueryClientProvider client={client}>
      <CommandsTab />
    </QueryClientProvider>,
  );
  await screen.findByText('ג׳קסון · גור סקרן');
  return user;
}
