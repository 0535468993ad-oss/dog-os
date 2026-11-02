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

/** Per-mode copy: screen title and caption, submit button, and the switch-mode prompt and button. */
export const MODE_COPY: Record<AuthMode, { title: string; caption: string; submit: string; switchPrompt: string; switchAction: string }> = {
  signIn: { title: 'ברוכים השבים', caption: 'מוכנים להרפתקה הבאה עם Dog OS?', submit: 'התחברות', switchPrompt: 'עדיין אין לכם חשבון?', switchAction: 'יצירת חשבון' },
  signUp: { title: 'יצירת חשבון', caption: 'חשבון אחד לאימונים, לבריאות ולכל מה שהכלב שלכם צריך.', submit: 'יצירת חשבון', switchPrompt: 'כבר יש לכם חשבון?', switchAction: 'התחברות' },
  reset: { title: 'איפוס סיסמה', caption: 'נשלח אליכם קישור לבחירת סיסמה חדשה.', submit: 'שליחת קישור לאיפוס', switchPrompt: 'כבר יש לכם חשבון?', switchAction: 'התחברות' },
};

/** Hero height: about 40% of the screen, bounded so the form stays reachable on small phones and the photo doesn't dominate a tablet. */
export function heroHeight(windowHeight: number): number {
  return Math.round(Math.min(Math.max(windowHeight * 0.4, 220), 440));
}

/** Where the switch-mode button leads: sign-up and reset go back to sign-in; sign-in goes to sign-up. */
export function switchTarget(mode: AuthMode): AuthMode {
  return mode === 'signIn' ? 'signUp' : 'signIn';
}
