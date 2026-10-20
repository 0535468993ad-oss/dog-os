import { SupportRateLimitError } from '../utils/rateLimitError';
import { submitErrorText, validateSupportRequest } from '../utils/validateRequest';

const VALID = { type: 'accessibility' as const, subject: ' קורא מסך ', message: '  הכפתור בעמוד הבית לא מוקרא  ', email: '' };

describe('validateSupportRequest', () => {
  it('returns the trimmed request when valid, with no errors', () => {
    expect(validateSupportRequest(VALID)).toEqual({
      input: { requestType: 'accessibility', subject: 'קורא מסך', message: 'הכפתור בעמוד הבית לא מוקרא', contactEmail: null },
      errors: {},
    });
  });

  it('keeps a valid contact email, trimmed', () => {
    expect(validateSupportRequest({ ...VALID, email: ' me@example.com ' }).input?.contactEmail).toBe('me@example.com');
  });

  it('reports every invalid field at once', () => {
    const { input, errors } = validateSupportRequest({ type: null, subject: 'א', message: 'קצר', email: 'not-an-email' });
    expect(input).toBeNull();
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'subject', 'type']);
  });

  it('measures length after trimming', () => {
    expect(validateSupportRequest({ ...VALID, message: '   קצר      ' }).errors.message).toBeDefined();
  });
});

describe('submitErrorText', () => {
  it('explains the daily limit', () => {
    expect(submitErrorText(new SupportRateLimitError())).toContain('מחר');
  });

  it('falls back to the generic submission message', () => {
    expect(submitErrorText(new Error('boom'))).toBe('שליחת הפנייה נכשלה. נסו שוב.');
  });
});
