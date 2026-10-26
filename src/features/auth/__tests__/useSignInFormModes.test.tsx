// Characterization of the sign-in hook's outcome per mode: reset link, sign-in failures (resend offered
// when the email is unconfirmed), sign-up with and without confirmation, and network errors.
import { act, renderHook } from '@testing-library/react-native';

import { NETWORK_ERROR } from '@/utils/errors';

import { requestPasswordReset, signIn, signUp } from '../api';
import { useSignInForm } from '../signIn/useSignInForm';

jest.mock('../api', () => ({
  requestPasswordReset: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  resendConfirmation: jest.fn(),
}));

async function filled(mode: 'signIn' | 'signUp' | 'reset') {
  const { result } = await renderHook(() => useSignInForm());
  await act(async () => {
    if (mode !== 'signIn') result.current.switchMode(mode);
  });
  await act(async () => {
    result.current.setEmail('owner@example.com');
    result.current.setPassword('a-long-password-123');
    result.current.setTermsAccepted(true);
    result.current.setAiAccepted(true);
  });
  return result;
}

describe('useSignInForm outcomes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reset: confirms the link was sent, or shows the error', async () => {
    jest.mocked(requestPasswordReset).mockResolvedValueOnce({ ok: true, value: undefined } as never);
    const result = await filled('reset');
    await act(() => result.current.submit());
    expect(requestPasswordReset).toHaveBeenCalledWith('owner@example.com');
    expect(result.current.feedback).toEqual({ kind: 'info', text: 'אם קיים חשבון עם הכתובת הזו, שלחנו אליה קישור לבחירת סיסמה חדשה. בדקו גם בתיקיית הספאם.' });
    jest.mocked(requestPasswordReset).mockResolvedValueOnce({ ok: false, message: 'שגיאה' } as never);
    await act(() => result.current.submit());
    expect(result.current.feedback).toEqual({ kind: 'error', text: 'שגיאה' });
  });

  it('sign-in: offers a resend only for an unconfirmed email', async () => {
    jest.mocked(signIn).mockResolvedValueOnce({ ok: false, message: 'לא אושר', code: 'email_not_confirmed' } as never);
    const result = await filled('signIn');
    await act(() => result.current.submit());
    expect(signIn).toHaveBeenCalledWith({ email: 'owner@example.com', password: 'a-long-password-123' });
    expect(result.current).toMatchObject({ feedback: { kind: 'error', text: 'לא אושר' }, canResend: true });
    jest.mocked(signIn).mockResolvedValueOnce({ ok: false, message: 'סיסמה שגויה', code: 'invalid_credentials' } as never);
    await act(() => result.current.submit());
    expect(result.current).toMatchObject({ feedback: { kind: 'error', text: 'סיסמה שגויה' }, canResend: false });
  });

  it('sign-up: switches to sign-in when a confirmation email was sent', async () => {
    jest.mocked(signUp).mockResolvedValueOnce({ ok: true, value: { needsEmailConfirmation: true } } as never);
    const result = await filled('signUp');
    await act(() => result.current.submit());
    expect(signUp).toHaveBeenCalledWith({ email: 'owner@example.com', password: 'a-long-password-123' });
    expect(result.current).toMatchObject({ mode: 'signIn', canResend: true, feedback: { kind: 'info', text: 'שלחנו לכם מייל לאישור החשבון. אחרי האישור – התחברו כאן.' } });
  });

  it('sign-up: shows an error, and leaves the form alone on success without confirmation', async () => {
    jest.mocked(signUp).mockResolvedValueOnce({ ok: false, message: 'קיים כבר' } as never);
    const result = await filled('signUp');
    await act(() => result.current.submit());
    expect(result.current).toMatchObject({ mode: 'signUp', feedback: { kind: 'error', text: 'קיים כבר' } });
    jest.mocked(signUp).mockResolvedValueOnce({ ok: true, value: { needsEmailConfirmation: false } } as never);
    await act(() => result.current.submit());
    expect(result.current).toMatchObject({ mode: 'signUp', feedback: null, canResend: false });
  });

  it('turns a thrown request into the network message and clears the busy flag', async () => {
    jest.mocked(signIn).mockRejectedValueOnce(new Error('offline'));
    const result = await filled('signIn');
    await act(() => result.current.submit());
    expect(result.current).toMatchObject({ feedback: { kind: 'error', text: NETWORK_ERROR }, submitting: false });
  });
});
