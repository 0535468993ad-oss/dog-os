// Last line of defence for errors no error boundary sees: exceptions thrown in event handlers, timers and
// native callbacks, and promise rejections nobody handles. Each one is reported through reportError (the
// single, sanitizing error path); none of them is allowed to close the app once it is running.
import { Platform } from 'react-native';

import { reportError } from '@/utils/errors';

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type Report = (error: unknown, where: string) => void;

interface HandlerOptions {
  isDev: boolean;
  /** React Native's default handler: the dev red box, or a crash in release builds. */
  previous: GlobalHandler;
  report: Report;
  /** Whether the app has rendered its first screen. */
  isAppReady: () => boolean;
}

/**
 * The global JS error handler. Development keeps React Native's red box. In release builds an error is
 * reported and swallowed, so a failed button handler doesn't close the app – except a fatal error during
 * start-up: the app can't render then, and a clean crash (and relaunch) beats a frozen splash screen.
 */
export function createGlobalErrorHandler({ isDev, previous, report, isAppReady }: HandlerOptions): GlobalHandler {
  return (error, isFatal) => {
    report(error, isFatal ? 'global:fatal' : 'global:uncaught');
    if (isDev || (isFatal && !isAppReady())) previous(error, isFatal);
  };
}

interface HermesRejectionTracker {
  enablePromiseRejectionTracker?: (options: { allRejections: boolean; onUnhandled: (id: number, error: unknown) => void; onHandled: (id: number) => void }) => void;
}

/** Reports promise rejections nobody handled. React Native only tracks them in development. */
export function trackUnhandledRejections(hermes: HermesRejectionTracker | undefined, report: Report): void {
  hermes?.enablePromiseRejectionTracker?.({
    allRejections: true,
    onUnhandled: (_id, error) => report(error, 'global:unhandled-rejection'),
    onHandled: () => undefined,
  });
}

interface WindowEvents {
  addEventListener(type: 'error', listener: (event: { error?: unknown; message?: string }) => void): void;
  addEventListener(type: 'unhandledrejection', listener: (event: { reason?: unknown }) => void): void;
}

/** Web: uncaught errors and unhandled rejections reach window events instead of ErrorUtils. */
export function installWebHandlers(target: WindowEvents, report: Report): void {
  target.addEventListener('error', (event) => report(event.error ?? event.message, 'global:window-error'));
  target.addEventListener('unhandledrejection', (event) => report(event.reason, 'global:unhandled-rejection'));
}

let installed = false;
let appReady = false;

/** Called once the root has rendered: from here on, even fatal errors are reported instead of crashing. */
export function markAppReady(): void {
  appReady = true;
}

/** Installs the handlers for this platform (once; safe to call again). */
export function installGlobalErrorHandlers(): void {
  if (installed) return;
  installed = true;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') installWebHandlers(window, reportError);
    return;
  }
  if (typeof ErrorUtils === 'undefined') return;
  ErrorUtils.setGlobalHandler(createGlobalErrorHandler({ isDev: __DEV__, previous: ErrorUtils.getGlobalHandler(), report: reportError, isAppReady: () => appReady }));
  // Development already has React Native's own tracker (LogBox warnings); release builds have none.
  if (!__DEV__) trackUnhandledRejections((globalThis as { HermesInternal?: HermesRejectionTracker }).HermesInternal, reportError);
}
