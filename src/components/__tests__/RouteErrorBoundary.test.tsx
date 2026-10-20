import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { RouteErrorBoundary } from '../RouteErrorBoundary';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const replace = router.replace as jest.Mock;

describe('RouteErrorBoundary', () => {
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    replace.mockReset();
  });
  afterEach(() => consoleError.mockRestore());

  it('announces the failure accessibly and reports it', async () => {
    const error = new Error('boom');
    await render(<RouteErrorBoundary error={error} retry={jest.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByRole('header', { name: 'משהו השתבש' })).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent(/המידע שלכם לא נפגע/);
    expect(consoleError).toHaveBeenCalledWith('[route-boundary]', error);
  });

  it('shows technical details only in development builds', async () => {
    await render(<RouteErrorBoundary error={new TypeError('x is undefined')} retry={jest.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByText('TypeError: x is undefined')).toBeOnTheScreen(); // __DEV__ is true under Jest
  });

  it('retries the route', async () => {
    const user = userEvent.setup();
    const retry = jest.fn().mockResolvedValue(undefined);
    await render(<RouteErrorBoundary error={new Error('boom')} retry={retry} />);

    await user.press(screen.getByRole('button', { name: 'נסו שוב' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('navigates home', async () => {
    const user = userEvent.setup();
    await render(<RouteErrorBoundary error={new Error('boom')} retry={jest.fn().mockResolvedValue(undefined)} />);

    await user.press(screen.getByRole('button', { name: 'חזרה לדף הבית' }));
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('falls back to retrying when there is no navigator to go home with', async () => {
    const user = userEvent.setup();
    const retry = jest.fn().mockResolvedValue(undefined);
    replace.mockImplementation(() => {
      throw new Error('navigation not ready');
    });
    await render(<RouteErrorBoundary error={new Error('boom')} retry={retry} />);

    await user.press(screen.getByRole('button', { name: 'חזרה לדף הבית' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
