import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

// Web-only consent for non-essential storage/scripts. Strictly necessary storage (the auth session and
// this choice itself) never needs consent. Native apps have no cookies, so they are treated as decided.

export interface CookieConsent {
  analytics: boolean;
  decidedAt: string;
}

const STORAGE_KEY = 'dogos-cookie-consent';
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // ask again after 12 months

const listeners = new Set<() => void>();
let cached: CookieConsent | null | undefined;

function read(): CookieConsent | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.decidedAt !== 'string') return null;
    if (Date.now() - new Date(parsed.decidedAt).getTime() > MAX_AGE_MS) return null;
    return { analytics: parsed.analytics, decidedAt: parsed.decidedAt };
  } catch {
    return null; // storage blocked (private mode) – behave as undecided, nothing non-essential loads
  }
}

export function getCookieConsent(): CookieConsent | null {
  if (cached === undefined) cached = read();
  return cached;
}

export function setCookieConsent(analytics: boolean): void {
  cached = { analytics, decidedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Keep the in-memory choice for this session.
  }
  listeners.forEach((listener) => listener());
}

export function resetCookieConsent(): void {
  cached = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  listeners.forEach((listener) => listener());
}

/** Gate for any future analytics/marketing script: load it only when this returns true. */
export function canLoadAnalytics(): boolean {
  return getCookieConsent()?.analytics === true;
}

export function useCookieConsent(): CookieConsent | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getCookieConsent,
    () => null,
  );
}
