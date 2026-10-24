// The commands tab end to end: rank card, command cards (category, difficulty, XP), the detail modal
// with its checklist haptic, the balanced safety gate, and the locked live-session confirm button.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent, within } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { CommandsTab } from '../components/CommandsTab';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));
jest.mock('@/features/gamification/api/gameRemote', () => ({ fetchRemoteGame: jest.fn(async () => null), upsertRemoteGame: jest.fn(async () => undefined) }));
jest.mock('@/features/dogs/hooks', () => ({
  useActiveDog: () => ({ isLoading: false, activeDog: { id: 'd1', name: 'ג׳קסון', breed: 'רועה גרמני', breed_id: 'german-shepherd', birth_date: '2023-09-01' } }),
}));

describe('CommandsTab', () => {
  // The storage mock persists across tests in a file; each test starts from a fresh dog.
  beforeEach(() => AsyncStorage.clear());

  it('shows the rank card and command cards with category, difficulty and XP', async () => {
    await renderTab();
    expect(screen.getByText('ג׳קסון · גור מגשש')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^4\. אליי \(Recall\), בטיחות מצילת חיים, בינוני, 100 XP, 0 אימונים$/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'ארון הגביעים והפרסים' })).toBeOnTheScreen();
  });

  it('recommends the balanced track for a high-arousal adult shepherd', async () => {
    const user = await renderTab();
    await user.press(screen.getByRole('radio', { name: 'עוררות גבוהה / דחף ציד קיצוני' }));
    expect(screen.getByText('מומלץ: אילוף מאוזן')).toBeOnTheScreen();
  });

  it('opens the command modal with steps, marker cues and the generalisation step; a checklist tick is a light tap', async () => {
    const user = await renderTab();
    await user.press(screen.getByRole('button', { name: /^1\. שב/ }));
    expect(screen.getAllByText(/"כן!" – ברגע שהישבן נוגע ברצפה/).length).toBeGreaterThan(0);
    expect(screen.getByText(/לאחר שהכלב מתרגל את הפקודה בסביבה הביתית השקטה/)).toBeOnTheScreen();
    await user.press(screen.getByRole('checkbox', { name: 'שלב 1: פיתוי' }));
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });

  it('opens the balanced protocol only after the safety notice, and locks it for an anxious dog', async () => {
    const user = await renderTab();
    await user.press(screen.getByRole('button', { name: /^1\. שב/ }));
    await user.press(screen.getByRole('tab', { name: 'אילוף מאוזן' }));
    expect(screen.getByRole('button', { name: 'פתיחת המסלול המאוזן' })).toBeDisabled();
    await user.press(screen.getByRole('checkbox', { name: 'קראתי, ואשתמש בציוד רק לפי הכללים האלה' }));
    await user.press(screen.getByRole('button', { name: 'פתיחת המסלול המאוזן' }));
    expect(screen.getByText(/לחץ רצועה עדין שמשתחרר ברגע הביצוע/)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'סגירה' }));
    await user.press(screen.getByRole('radio', { name: 'חרדתי / רגיש' }));
    await user.press(screen.getByRole('button', { name: /^4\. אליי/ }));
    await user.press(screen.getByRole('tab', { name: 'אילוף מאוזן' }));
    expect(screen.getByText(/המסלול המאוזן לא מתאים לכלב הזה/)).toBeOnTheScreen();
  });

  it('keeps the confirm button locked at the start of a live session, and banks step XP for a ticked step', async () => {
    const user = await renderTab();
    await user.press(screen.getByRole('button', { name: /^1\. שב/ }));
    await user.press(screen.getByRole('button', { name: 'התחלת אימון חי' }));
    expect(screen.getByRole('button', { name: /אישור ייפתח בעוד 3:00/ })).toBeDisabled();
    const [firstStep] = screen.getAllByRole('checkbox');
    if (!firstStep) throw new Error('no step checkbox');
    await user.press(firstStep);
    expect(Haptics.impactAsync).toHaveBeenLastCalledWith('light');
    expect(screen.getByText('שלבים שסומנו: +25 XP, נזקפים עם אישור האימון')).toBeOnTheScreen();
  });

  it('pins a dog banner with the breed note, gear badges and step progress over the command story', async () => {
    const user = await renderTab();
    await user.press(screen.getByRole('button', { name: /^4\. אליי/ }));
    expect(screen.getByText('ג׳קסון · רועה גרמני')).toBeOnTheScreen();
    expect(screen.getByText(/^גזע עבודה:/)).toBeOnTheScreen();
    expect(screen.getByRole('progressbar', { name: /^התקדמות בשלבים: שלב 1 מתוך \d+$/ })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^רצועת ביותן ארוכה 10–15 מ׳: מחוברת לרתמה/)).toBeOnTheScreen();
  });

  it('shows the anxious-dog adjustment in the banner once the dog is marked anxious', async () => {
    const user = await renderTab();
    await user.press(screen.getByRole('radio', { name: 'חרדתי / רגיש' }));
    await user.press(screen.getByRole('button', { name: /^1\. שב/ }));
    const banner = within(screen.getByRole('summary'));
    expect(banner.getByText(/^לכלב חרדתי: מתאמנים בפינה מוכרת ושקטה/)).toBeOnTheScreen();
    expect(banner.getByText('מומלץ: חיזוק חיובי (R+)')).toBeOnTheScreen();
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
  await screen.findByText('ג׳קסון · גור מגשש');
  return user;
}
