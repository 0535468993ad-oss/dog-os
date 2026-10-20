import { MIN_PASSWORD_LENGTH } from '../api';

export type AuthMode = 'signIn' | 'signUp' | 'reset';

export interface SignInValues {
  email: string;
  password: string;
  termsAccepted: boolean;
  aiAccepted: boolean;
}

export interface SignInErrors {
  email?: string;
  password?: string;
  terms?: string;
  ai?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Basic shape check for an email address (the server is the real authority). */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/**
 * Field errors for the current mode: reset needs only an email; sign-up also needs a strong-enough
 * password and both consents; sign-in needs any password.
 */
export function validateSignIn(mode: AuthMode, values: SignInValues): SignInErrors {
  const errors: SignInErrors = {};
  if (!isValidEmail(values.email)) errors.email = 'הזינו כתובת אימייל תקינה.';
  if (mode === 'signUp' && values.password.length < MIN_PASSWORD_LENGTH) errors.password = `הסיסמה צריכה להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים.`;
  if (mode === 'signIn' && values.password.length === 0) errors.password = 'הזינו סיסמה.';
  if (mode === 'signUp' && !values.termsAccepted) errors.terms = 'יש לאשר את התקנון ומדיניות הפרטיות.';
  if (mode === 'signUp' && !values.aiAccepted) errors.ai = 'יש לאשר את הצהרת הבינה המלאכותית.';
  return errors;
}

/** Per-mode copy: screen title, submit button, and the switch-mode prompt and button. */
export const MODE_COPY: Record<AuthMode, { title: string; submit: string; switchPrompt: string; switchAction: string }> = {
  signIn: { title: 'ברוכים השבים', submit: 'התחברות', switchPrompt: 'עדיין אין לכם חשבון?', switchAction: 'הרשמה' },
  signUp: { title: 'יצירת חשבון', submit: 'יצירת חשבון', switchPrompt: 'כבר יש לכם חשבון?', switchAction: 'התחברות' },
  reset: { title: 'איפוס סיסמה', submit: 'שליחת קישור לאיפוס', switchPrompt: 'כבר יש לכם חשבון?', switchAction: 'התחברות' },
};

/** Where the switch-mode button leads: sign-up and reset go back to sign-in; sign-in goes to sign-up. */
export function switchTarget(mode: AuthMode): AuthMode {
  return mode === 'signIn' ? 'signUp' : 'signIn';
}
