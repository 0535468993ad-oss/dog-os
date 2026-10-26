// The diagnostic onboarding end to end: intro, dog, the four question steps, the profile card with the
// owner's own track choice, the age lock, adding a first dog, and skipping.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { upsertRemoteGame } from '@/features/gamification/api/gameRemote';
import { addDays, todayIso } from '@/utils/date';

import { setOnboardingCompleted } from '../api/onboardingApi';
import { OnboardingScreen } from '../OnboardingScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true } }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));
jest.mock('@/features/gamification/api/gameRemote', () => ({ fetchRemoteGame: jest.fn(async () => null), upsertRemoteGame: jest.fn(async () => undefined) }));
jest.mock('@/features/auth/AuthProvider', () => ({ useUser: () => ({ id: 'u1' }) }));
jest.mock('../api/onboardingApi', () => ({ setOnboardingCompleted: jest.fn(async () => undefined) }));

const ADULT = { id: 'd1', name: 'ג׳קסון', breed: 'רועה גרמני', breed_id: 'german-shepherd', birth_date: '2023-09-01' };
const mockDogs: { current: (typeof ADULT)[]; server: (typeof ADULT)[] | null } = { current: [ADULT], server: null };
jest.mock('@/features/dogs/hooks', () => ({
  useActiveDog: () => ({
    isLoading: false,
    dogs: mockDogs.current,
    activeDog: mockDogs.current[0] ?? null,
    // The server's view when the wizard re-checks before saving (null: same as the cached list).
    refetch: async () => [{ isError: false, data: mockDogs.server ?? mockDogs.current }, { isError: false }],
  }),
  useProfile: () => ({ isLoading: false, isError: false, data: { onboarding_completed: false } }),
}));

type User = ReturnType<typeof userEvent.setup>;

// Each case walks the whole wizard (about 30 presses); under a full parallel run that can pass the
// default 5 s, so these tests get an explicit budget.
jest.setTimeout(30_000);

async function renderScreen() {
  const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const user = userEvent.setup();
  await render(
    <QueryClientProvider client={client}>
      <OnboardingScreen mode="FIRST_RUN" />
    </QueryClientProvider>,
  );
  return user;
}

const next = (user: User) => user.press(screen.getByRole('button', { name: 'המשך' }));

/** Intro → the dog → all four question steps, with a dog that pushes through corrections. */
async function answerAll(user: User) {
  await user.press(screen.getByRole('button', { name: 'מתחילים' }));
  await user.press(screen.getByRole('radio', { name: 'ג׳קסון' }));
  await next(user);
  await user.press(screen.getByRole('radio', { name: 'דירה בשכונה שקטה' }));
  await user.press(screen.getByRole('radio', { name: 'גידלתי ואילפתי כלבים בעבר' }));
  await next(user);
  // Three 1–5 scales (food, play, energy), each with its own "3".
  const middles = screen.getAllByRole('radio', { name: '3' });
  expect(middles).toHaveLength(3);
  for (const middle of middles) await user.press(middle);
  await next(user);
  await user.press(screen.getByRole('radio', { name: 'נבהל, וחוזר לעצמו מהר' }));
  await user.press(screen.getByRole('radio', { name: 'מתעלם וממשיך' }));
  await next(user);
  await user.press(screen.getByRole('radio', { name: 'בודק אותי כל הזמן' }));
  await user.press(screen.getByRole('radio', { name: 'רגוע וחברותי' }));
  await user.press(screen.getByRole('checkbox', { name: 'הליכה בלי משיכות' }));
  await next(user);
}

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDogs.current = [ADULT];
    mockDogs.server = null;
    return AsyncStorage.clear();
  });

  it('profiles the dog, recommends a track, and saves the owner’s own choice', async () => {
    const user = await renderScreen();
    await user.press(screen.getByRole('button', { name: 'מתחילים' }));
    await user.press(screen.getByRole('radio', { name: 'ג׳קסון' }));
    await next(user);
    // The age stage is prefilled from the birth date.
    expect(screen.getByRole('radio', { name: 'בוגר (שנה וחצי עד 7)', checked: true })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'חזרה' }));
    await user.press(screen.getByRole('button', { name: 'חזרה' }));
    await answerAll(user);

    expect(await screen.findByText('מומלץ: אילוף מאוזן')).toBeOnTheScreen();
    await user.press(screen.getByRole('tab', { name: 'חיזוק חיובי (R+)' }));
    expect(screen.getByText(/בחרתם מסלול אחר מההמלצה/)).toBeOnTheScreen();
    const save = screen.getByRole('button', { name: 'שמירה והמשך' });
    await waitFor(() => expect(save).toBeEnabled());
    await user.press(save);

    await waitFor(() => expect(setOnboardingCompleted).toHaveBeenCalledWith('u1'));
    await waitFor(() => expect(upsertRemoteGame).toHaveBeenCalled());
    const saved = jest.mocked(upsertRemoteGame).mock.calls.at(-1)?.[1];
    expect(saved?.preferences.assessment).toMatchObject({ selectedTrack: 'FORCE_FREE', ownerOverrodeTrack: true });
    expect(saved?.preferences.temperament).toBe('STEADY');
  });

  it('keeps a puppy on force-free and explains the lock on the profile card', async () => {
    mockDogs.current = [{ ...ADULT, birth_date: addDays(todayIso(), -90) }];
    const user = await renderScreen();
    await answerAll(user);
    expect(await screen.findByText('מומלץ: חיזוק חיובי (R+)')).toBeOnTheScreen();
    // The floor is listed among the warnings; tapping balanced repeats it as an announced alert.
    const floor = /לפני גיל 6 חודשים לא משתמשים בציוד אוורסיבי/;
    expect(screen.getAllByText(floor)).toHaveLength(1);
    await user.press(screen.getByRole('tab', { name: 'אילוף מאוזן' }));
    expect(screen.getAllByText(floor)).toHaveLength(2);
    expect(screen.getByRole('tab', { name: 'חיזוק חיובי (R+)', selected: true })).toBeOnTheScreen();
  });

  it('stays on the card with a retry when the assessment cannot be stored on the device', async () => {
    const user = await renderScreen();
    await answerAll(user);
    const save = await screen.findByRole('button', { name: 'שמירה והמשך' });
    await waitFor(() => expect(save).toBeEnabled());
    // Only the assessment's device write fails, and only once the game state has loaded.
    const setItem = AsyncStorage.setItem.bind(AsyncStorage);
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockImplementation((key: string, value: string) =>
      key.startsWith('training-game:') ? Promise.reject(new Error('disk full')) : setItem(key, value),
    );
    try {
      await user.press(save);
      expect(await screen.findByText('לא הצלחנו לשמור את האבחון במכשיר. נסו שוב.')).toBeOnTheScreen();
      expect(setOnboardingCompleted).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'שמירה והמשך' })).toBeOnTheScreen();
    } finally {
      spy.mockRestore();
    }
  });

  it('goes back to the dog step, saving nothing, when the dog was deleted elsewhere', async () => {
    const user = await renderScreen();
    await answerAll(user);
    const save = await screen.findByRole('button', { name: 'שמירה והמשך' });
    await waitFor(() => expect(save).toBeEnabled());
    mockDogs.server = [];
    await user.press(save);
    expect(await screen.findByText('את מי אנחנו מאבחנים?')).toBeOnTheScreen();
    expect(setOnboardingCompleted).not.toHaveBeenCalled();
    expect(upsertRemoteGame).not.toHaveBeenCalledWith('d1', expect.objectContaining({ preferences: expect.objectContaining({ assessment: expect.anything() }) }), expect.anything());
  });

  it('never saves a balanced choice for a dog that became locked while the card was open', async () => {
    const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const tree = () => (
      <QueryClientProvider client={client}>
        <OnboardingScreen mode="FIRST_RUN" />
      </QueryClientProvider>
    );
    const user = userEvent.setup();
    const view = await render(tree());
    await answerAll(user);
    expect(await screen.findByRole('tab', { name: 'אילוף מאוזן', selected: true })).toBeOnTheScreen();
    // The birth date is corrected (on another screen or device) to a 3-month-old puppy.
    mockDogs.current = [{ ...ADULT, birth_date: addDays(todayIso(), -90) }];
    await view.rerender(tree());
    expect(screen.getByRole('tab', { name: 'חיזוק חיובי (R+)', selected: true })).toBeOnTheScreen();
    const save = screen.getByRole('button', { name: 'שמירה והמשך' });
    await waitFor(() => expect(save).toBeEnabled());
    await user.press(save);
    await waitFor(() => expect(upsertRemoteGame).toHaveBeenCalled());
    expect(jest.mocked(upsertRemoteGame).mock.calls.at(-1)?.[1].preferences.assessment).toMatchObject({ selectedTrack: 'FORCE_FREE' });
  });

  it('sends an owner with no dog to add one first', async () => {
    mockDogs.current = [];
    const user = await renderScreen();
    await user.press(screen.getByRole('button', { name: 'מתחילים' }));
    expect(screen.getByRole('button', { name: 'המשך' })).toBeDisabled();
    await user.press(screen.getByRole('button', { name: 'הוספת כלב' }));
    expect(router.push).toHaveBeenCalledWith('/dogs/edit');
  });

  it('re-assesses the requested dog straight from the questions, prefilled from its birth date', async () => {
    const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
    await render(
      <QueryClientProvider client={new QueryClient()}>
        <OnboardingScreen mode="REASSESS" dogId="d1" />
      </QueryClientProvider>,
    );
    expect(screen.getByText('שלב 1 מתוך 5')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'בוגר (שנה וחצי עד 7)', checked: true })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'ביטול' })).toBeOnTheScreen();
  });

  it('can always be skipped', async () => {
    const user = await renderScreen();
    await user.press(screen.getByRole('button', { name: 'דלג בינתיים' }));
    await waitFor(() => expect(setOnboardingCompleted).toHaveBeenCalledWith('u1'));
  });
});
