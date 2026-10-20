// The crash shield: errors outside render are reported, release builds keep running, and a fatal error
// during start-up still ends the app cleanly instead of freezing the splash screen.
import { createGlobalErrorHandler, installWebHandlers, trackUnhandledRejections } from '../globalErrorHandler';

function setup(isDev: boolean, ready: boolean) {
  const previous = jest.fn();
  const report = jest.fn();
  const handler = createGlobalErrorHandler({ isDev, previous, report, isAppReady: () => ready });
  return { previous, report, handler };
}

describe('createGlobalErrorHandler', () => {
  const error = new Error('boom');

  it('reports and keeps the red box in development', () => {
    const { previous, report, handler } = setup(true, true);
    handler(error, false);
    expect(report).toHaveBeenCalledWith(error, 'global:uncaught');
    expect(previous).toHaveBeenCalledWith(error, false);
  });

  it('reports and swallows a non-fatal error in release builds', () => {
    const { previous, report, handler } = setup(false, false);
    handler(error, false);
    expect(report).toHaveBeenCalledWith(error, 'global:uncaught');
    expect(previous).not.toHaveBeenCalled();
  });

  it('reports and swallows a fatal error once the app is running', () => {
    const { previous, report, handler } = setup(false, true);
    handler(error, true);
    expect(report).toHaveBeenCalledWith(error, 'global:fatal');
    expect(previous).not.toHaveBeenCalled();
  });

  it('lets a fatal error during start-up reach the default handler', () => {
    const { previous, report, handler } = setup(false, false);
    handler(error, true);
    expect(report).toHaveBeenCalledWith(error, 'global:fatal');
    expect(previous).toHaveBeenCalledWith(error, true);
  });
});

describe('trackUnhandledRejections', () => {
  it('reports every unhandled rejection through the Hermes tracker', () => {
    const report = jest.fn();
    const enablePromiseRejectionTracker = jest.fn();
    trackUnhandledRejections({ enablePromiseRejectionTracker }, report);

    const options = enablePromiseRejectionTracker.mock.calls[0]?.[0];
    expect(options.allRejections).toBe(true);
    const reason = new Error('rejected');
    options.onUnhandled(1, reason);
    expect(report).toHaveBeenCalledWith(reason, 'global:unhandled-rejection');
  });

  it('does nothing without Hermes', () => {
    expect(() => trackUnhandledRejections(undefined, jest.fn())).not.toThrow();
    expect(() => trackUnhandledRejections({}, jest.fn())).not.toThrow();
  });
});

describe('installWebHandlers', () => {
  it('reports window errors and unhandled rejections', () => {
    const listeners: Record<string, (event: never) => void> = {};
    const target = { addEventListener: (type: string, listener: (event: never) => void) => void (listeners[type] = listener) };
    const report = jest.fn();
    installWebHandlers(target as never, report);

    const error = new Error('web');
    listeners.error?.({ error } as never);
    listeners.error?.({ message: 'Script error.' } as never);
    listeners.unhandledrejection?.({ reason: 'nope' } as never);

    expect(report.mock.calls).toEqual([
      [error, 'global:window-error'],
      ['Script error.', 'global:window-error'],
      ['nope', 'global:unhandled-rejection'],
    ]);
  });
});
