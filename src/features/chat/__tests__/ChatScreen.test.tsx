// Characterization of the advisor screen's send paths: typed and chip sends, the on-device emergency
// intercept (send anyway / close restores the draft), a failed send restoring the draft, the consent gate
// and the sending guard.
import { render, screen, userEvent } from '@testing-library/react-native';

import { makeDog } from '@/test/fixtures';

import { ChatScreen } from '../ChatScreen';

const mockDog = makeDog({ name: 'ג׳קסון' });
const mockState = { sharing: 'allowed' as 'allowed' | 'opted_out' | 'unknown', isSending: false, failNext: false };
const mockSend = jest.fn((message: string, onFailed: (text: string) => void) => {
  if (mockState.failNext) onFailed(message);
});

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/auth/AuthProvider', () => ({ useUser: () => ({ id: 'u1' }) }));
jest.mock('@/features/legal/hooks/consents', () => ({ useAiSharing: () => mockState.sharing }));
jest.mock('@/features/dogs/hooks', () => ({
  useActiveDog: () => ({ dogs: [mockDog], activeDog: mockDog, isLoading: false }),
  useSetActiveDog: () => ({ mutate: jest.fn(), isPending: false }),
  useDogPhotoUrl: () => ({ data: null, isLoading: false }),
}));
jest.mock('../hooks/useChatConversation', () => ({
  useChatConversation: () => ({
    history: { isLoading: false, error: null, data: [], refetch: jest.fn() },
    messages: [],
    error: null,
    isSending: mockState.isSending,
    isClearing: false,
    sendMessage: mockSend,
    clearConversation: jest.fn(),
  }),
}));

const input = () => screen.getByLabelText('הודעה ליועץ');

async function renderChat() {
  const user = userEvent.setup();
  await render(<ChatScreen />);
  return user;
}

describe('ChatScreen send paths', () => {
  beforeEach(() => {
    mockSend.mockClear();
    Object.assign(mockState, { sharing: 'allowed', isSending: false, failNext: false });
  });

  it('sends a typed message and clears the composer', async () => {
    const user = await renderChat();
    await user.type(input(), 'כמה לטייל ביום?');
    await user.press(screen.getByRole('button', { name: 'שליחה' }));
    expect(mockSend).toHaveBeenCalledWith('כמה לטייל ביום?', expect.any(Function));
    expect(input()).toHaveDisplayValue('');
  });

  it("sends a prompt chip's question", async () => {
    const user = await renderChat();
    await user.press(screen.getByLabelText(/: כמה מים ג׳קסון צריך לשתות ביום\?$/));
    expect(mockSend).toHaveBeenCalledWith('כמה מים ג׳קסון צריך לשתות ביום?', expect.any(Function));
  });

  it('intercepts an emergency on the device, then sends it anyway on request', async () => {
    const user = await renderChat();
    await user.type(input(), 'הכלב אכל שוקולד');
    await user.press(screen.getByRole('button', { name: 'שליחה' }));
    expect(mockSend).not.toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: 'זו לא בעיה דחופה – לשלוח ליועץ' }));
    expect(mockSend).toHaveBeenCalledWith('הכלב אכל שוקולד', expect.any(Function));
  });

  it('closing the emergency panel puts the message back in the composer', async () => {
    const user = await renderChat();
    await user.type(input(), 'הכלב אכל שוקולד');
    await user.press(screen.getByRole('button', { name: 'שליחה' }));
    await user.press(screen.getByRole('button', { name: 'סגירה' }));
    expect(mockSend).not.toHaveBeenCalled();
    expect(input()).toHaveDisplayValue('הכלב אכל שוקולד');
  });

  it('restores the draft when a send fails', async () => {
    mockState.failNext = true;
    const user = await renderChat();
    await user.type(input(), 'שאלה שנכשלה');
    await user.press(screen.getByRole('button', { name: 'שליחה' }));
    expect(input()).toHaveDisplayValue('שאלה שנכשלה');
  });

  it('shows the consent notice instead of the composer when sharing is off', async () => {
    mockState.sharing = 'opted_out';
    await renderChat();
    expect(screen.queryByLabelText('הודעה ליועץ')).toBeNull();
    expect(screen.getByText('שיתוף מידע עם היועץ החכם כבוי')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'ניהול הסכמות' })).toBeOnTheScreen();
  });

  it('refuses to send while a message is on its way', async () => {
    mockState.isSending = true;
    const user = await renderChat();
    await user.type(input(), 'עוד שאלה');
    await user.press(screen.getByRole('button', { name: 'שליחה' }));
    expect(mockSend).not.toHaveBeenCalled();
  });
});
