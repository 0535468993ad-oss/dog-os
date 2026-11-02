import { heroHeight } from '../signIn/signInLogic';
import { isAppleCancel, socialButtons, socialLabel } from '../signIn/socialLogic';

describe('socialButtons', () => {
  it('uses the system Apple sheet on iOS when it is available', () => {
    expect(socialButtons('ios', true)).toEqual([
      { provider: 'google', method: 'browser' },
      { provider: 'apple', method: 'native' },
    ]);
  });

  it('falls back to the browser flow for Apple everywhere else', () => {
    for (const [os, available] of [['ios', false], ['android', true], ['web', true]] as const) {
      expect(socialButtons(os, available).find((button) => button.provider === 'apple')?.method).toBe('browser');
    }
  });

  it('always offers Google through the browser', () => {
    expect(socialButtons('android', false)[0]).toEqual({ provider: 'google', method: 'browser' });
  });
});

describe('isAppleCancel', () => {
  it('recognises the user closing the Apple sheet', () => {
    expect(isAppleCancel({ code: 'ERR_REQUEST_CANCELED' })).toBe(true);
  });

  it.each([[new Error('boom')], [{ code: 'ERR_REQUEST_FAILED' }], [null], ['ERR_REQUEST_CANCELED'], [Object.create({ code: 'ERR_REQUEST_CANCELED' })]])(
    'treats %p as a real failure',
    (error) => {
      expect(isAppleCancel(error)).toBe(false);
    },
  );
});

describe('socialLabel', () => {
  it('names the provider in the accessible label', () => {
    expect(socialLabel('google')).toBe('המשך עם Google');
    expect(socialLabel('apple')).toBe('המשך עם Apple');
  });
});

describe('heroHeight', () => {
  it('takes about 40% of a phone screen', () => {
    expect(heroHeight(800)).toBe(320);
  });

  it('stays within bounds on very small and very tall screens', () => {
    expect(heroHeight(400)).toBe(220);
    expect(heroHeight(2000)).toBe(440);
  });
});
