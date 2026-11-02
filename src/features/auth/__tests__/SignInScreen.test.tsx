import { render, screen, userEvent } from '@testing-library/react-native';

import { signInWithProvider } from '../api';
import { HERO_IMAGE_ALT } from '../signIn/heroImage';
import { SignInScreen } from '../SignInScreen';

jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  signIn: jest.fn(),
  signUp: jest.fn(),
  requestPasswordReset: jest.fn(),
  resendConfirmation: jest.fn(),
  signInWithProvider: jest.fn(),
  signInWithAppleNative: jest.fn(),
}));
jest.mock('expo-apple-authentication', () => ({
  ...jest.requireActual('expo-apple-authentication'),
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
}));
jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { router: { push: jest.fn() }, Link: ({ href: _href, ...props }: Record<string, unknown>) => createElement(Text, props) };
});

describe('SignInScreen', () => {
  it('greets the user over the hero and offers email, Google and Apple sign-in', async () => {
    await render(<SignInScreen />);

    expect(screen.getByLabelText(HERO_IMAGE_ALT)).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'ברוכים השבים' })).toBeOnTheScreen();
    expect(screen.getByText('מוכנים להרפתקה הבאה עם Dog OS?')).toBeOnTheScreen();
    expect(screen.getByLabelText('אימייל')).toBeOnTheScreen();
    expect(screen.getByLabelText('סיסמה')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'הצגת הסיסמה' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'התחברות' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'המשך עם Google' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'המשך עם Apple' })).toBeOnTheScreen();
  });

  it('starts Google sign-in and announces a failure', async () => {
    const user = userEvent.setup();
    jest.mocked(signInWithProvider).mockResolvedValue({ ok: false, message: 'ההתחברות לא הושלמה. נסו שוב.' });
    await render(<SignInScreen />);

    await user.press(screen.getByRole('button', { name: 'המשך עם Google' }));

    expect(signInWithProvider).toHaveBeenCalledWith('google');
    expect(await screen.findByRole('alert')).toHaveTextContent('ההתחברות לא הושלמה. נסו שוב.');
  });

  it('says nothing when the user cancels the provider sheet', async () => {
    const user = userEvent.setup();
    jest.mocked(signInWithProvider).mockResolvedValue({ ok: true, value: 'cancelled' });
    await render(<SignInScreen />);

    await user.press(screen.getByRole('button', { name: 'המשך עם Apple' }));

    expect(signInWithProvider).toHaveBeenCalledWith('apple');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('hides the social row while resetting a password', async () => {
    const user = userEvent.setup();
    await render(<SignInScreen />);

    await user.press(screen.getByRole('button', { name: 'שכחתם סיסמה?' }));

    expect(screen.getByRole('header', { name: 'איפוס סיסמה' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'המשך עם Google' })).toBeNull();
  });
});
