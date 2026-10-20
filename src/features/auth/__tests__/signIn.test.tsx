import { act, renderHook } from '@testing-library/react-native';

import { resendConfirmation, signIn } from '../api';
import { isValidEmail, MODE_COPY, switchTarget, validateSignIn } from '../signIn/signInLogic';
import { useSignInForm } from '../signIn/useSignInForm';

jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  signIn: jest.fn(),
  signUp: jest.fn(),
  requestPasswordReset: jest.fn(),
  resendConfirmation: jest.fn(),
}));

const valid = { email: 'owner@example.com', password: 'longpassword', termsAccepted: true, aiAccepted: true };

describe('sign-in logic', () => {
  it('checks the email shape', () => {
    expect(isValidEmail(' owner@example.com ')).toBe(true);
    expect(isValidEmail('owner@')).toBe(false);
  });

  it('needs only an email to reset a password', () => {
    expect(validateSignIn('reset', { ...valid, password: '', termsAccepted: false, aiAccepted: false })).toEqual({});
  });

  it('needs any password to sign in', () => {
    expect(validateSignIn('signIn', { ...valid, password: '' })).toEqual({ password: 'הזינו סיסמה.' });
    expect(validateSignIn('signIn', { ...valid, password: 'x', termsAccepted: false })).toEqual({});
  });

  it('needs a long password and both consents to sign up', () => {
    expect(Object.keys(validateSignIn('signUp', { ...valid, password: 'short', termsAccepted: false, aiAccepted: false })).sort()).toEqual(['ai', 'password', 'terms']);
    expect(validateSignIn('signUp', valid)).toEqual({});
  });

  it('switches between modes', () => {
    expect(switchTarget('signIn')).toBe('signUp');
    expect(switchTarget('signUp')).toBe('signIn');
    expect(switchTarget('reset')).toBe('signIn');
    expect(MODE_COPY.reset.submit).toBe('שליחת קישור לאיפוס');
  });
});

describe('useSignInForm', () => {
  // Regression: a thrown resend left `submitting` true forever, disabling the whole form.
  it('recovers from a network failure while resending the confirmation', async () => {
    (resendConfirmation as jest.Mock).mockRejectedValue(new TypeError('Network request failed'));
    const { result } = await renderHook(() => useSignInForm());

    await act(() => result.current.resend());

    expect(result.current.submitting).toBe(false);
    expect(result.current.feedback).toEqual({ kind: 'error', text: expect.stringMatching(/אין חיבור/) });
  });

  it('offers to resend when the email is not confirmed yet', async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: false, message: 'יש לאשר את כתובת האימייל לפני ההתחברות.', code: 'email_not_confirmed' });
    const { result } = await renderHook(() => useSignInForm());

    await act(() => {
      result.current.setEmail('owner@example.com');
      result.current.setPassword('secret');
    });
    await act(() => result.current.submit());

    expect(result.current.canResend).toBe(true);
    expect(result.current.feedback?.kind).toBe('error');
  });

  it('validates before calling the server', async () => {
    (signIn as jest.Mock).mockClear();
    const { result } = await renderHook(() => useSignInForm());

    await act(() => result.current.submit());

    expect(signIn).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBeDefined();
  });
});
