// Characterization of the persona switcher and honour contract: switching persona, a hold released early
// (not signed), signing by the screen-reader activate action, and the signed state.
import { act, fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { hapticCelebrate, hapticHeartbeat } from '@/features/gamification/hooks/haptics';

import { ThumbprintContractModal } from '../components/ThumbprintContractModal';

jest.mock('@/features/gamification/hooks/haptics', () => ({ hapticCelebrate: jest.fn(), hapticHeartbeat: jest.fn() }));

const UNSIGNED = 'חתימה על החוזה – לחיצה ארוכה של שלוש שניות';

async function renderModal() {
  const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const user = userEvent.setup();
  await render(
    <QueryClientProvider client={new QueryClient()}>
      <ThumbprintContractModal visible dogId="d1" dogName="ג׳קסון" onClose={jest.fn()} />
    </QueryClientProvider>,
  );
  return user;
}

describe('ThumbprintContractModal', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('shows the contract for the dog and switches persona', async () => {
    const user = await renderModal();
    expect(screen.getByText('חוזה הכבוד עם ג׳קסון')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'הפרופסור לאתולוגיה' })).toBeChecked();
    await user.press(screen.getByRole('radio', { name: 'הערס השכונתי' }));
    await waitFor(() => expect(screen.getByRole('radio', { name: 'הערס השכונתי' })).toBeChecked());
  });

  it('does not sign when the hold is released early', async () => {
    await renderModal();
    const thumb = screen.getByRole('button', { name: UNSIGNED });
    await fireEvent(thumb, 'pressIn');
    expect(hapticHeartbeat).toHaveBeenCalled();
    await fireEvent(thumb, 'pressOut');
    expect(screen.getByRole('button', { name: UNSIGNED })).toBeOnTheScreen();
    expect(hapticCelebrate).not.toHaveBeenCalled();
  });

  it('signs after a full three-second hold', async () => {
    jest.useFakeTimers();
    try {
      await renderModal();
      await fireEvent(screen.getByRole('button', { name: UNSIGNED }), 'pressIn');
      await act(async () => {
        jest.advanceTimersByTime(3_500);
      });
      await waitFor(() => expect(screen.getByRole('button', { name: 'החוזה נחתם' })).toBeOnTheScreen());
      expect(hapticCelebrate).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('signs with the screen-reader activate action and then shows the signed state', async () => {
    await renderModal();
    await fireEvent(screen.getByRole('button', { name: UNSIGNED }), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'החוזה נחתם' })).toBeDisabled());
    expect(hapticCelebrate).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/^נחתם ב־/)).toBeOnTheScreen();
  });
});
